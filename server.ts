import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storageSupabase';
import { bmoni, BMONI_TEST_IDENTITIES } from './server/bmoni';

type OwnerSession = {
  ownerId: string;
  createdAt: number;
};

const SESSION_COOKIE = 'teamcards_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const sessions = new Map<string, OwnerSession>();

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

function createSession(ownerId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { ownerId, createdAt: Date.now() });
  pruneExpiredSessions();
  return token;
}

function getSessionOwnerId(req: express.Request): string | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return session.ownerId;
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
}

function clearSessionCookie(res: express.Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

async function getAuthenticatedOwner(req: express.Request) {
  const ownerId = getSessionOwnerId(req);
  if (!ownerId) return null;
  return storage.getOwnerByIdAsync(ownerId);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // 1. Auth & Session (Owner account)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const owner = await storage.getOwnerByEmailAsync(email);
      if (!owner) {
        return res.status(404).json({ error: 'No account found for this email' });
      }

      const token = createSession(owner.id);
      setSessionCookie(res, token);
      return res.json({ owner, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, companyName, password } = req.body;
      if (!name || !email || !companyName) {
        return res.status(400).json({ error: 'Name, email, and company name are required' });
      }

      const existing = await storage.getOwnerByEmailAsync(email);
      if (existing) {
        return res.status(400).json({ error: 'An owner account with this email already exists' });
      }

      const bmoniUser = await bmoni.createUser({ name, email });

      const walletRes = await bmoni.provisionWallet(bmoniUser.userId, companyName);

      const owner = await storage.createOwnerAsync({
        name,
        email,
        companyName,
        bmoniUserId: bmoniUser.userId,
        bmoniWalletId: walletRes.walletId,
        kycStatus: 'UNINITIALIZED',
        virtualAccount: walletRes.virtualAccount
      });

      await storage.setWalletBalanceAsync(walletRes.walletId, 500000);

      const token = createSession(owner.id);
      setSessionCookie(res, token);

      res.status(201).json({ owner });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: err.message || 'Failed to complete signup' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      res.json({ owner });
    } catch (err: any) {
      console.error('Auth me error:', err);
      res.status(500).json({ error: 'Failed to fetch owner' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ success: true });
  });

  // 2. KYC Activation
  app.get('/api/kyc/test-identities', (_req, res) => {
    res.json({ identities: BMONI_TEST_IDENTITIES });
  });

  app.post('/api/kyc/submit', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { bvn, firstName, lastName, dob, phone, address } = req.body;

      const result = await bmoni.activateKyc({
        userId: owner.bmoniUserId || 'bmoni_usr_temp',
        bvn,
        firstName,
        lastName,
        dob,
        phone,
        companyName: owner.companyName,
        address
      });

      if (result.status === 'FAILED') {
        await storage.updateOwnerAsync(owner.id, { kycStatus: 'FAILED' });
        return res.status(400).json({
          error: result.message,
          errorCode: result.errorCode || 'ERR_KYC_FAILED'
        });
      }

      const updatedOwner = await storage.updateOwnerAsync(owner.id, {
        kycStatus: result.status,
        kycDetails: { bvn, phone, dob, address }
      });

      const webhookPayload = {
        event: 'kyc.activated',
        userId: owner.bmoniUserId,
        kycReference: result.kycReference,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      };
      const rawPayload = JSON.stringify(webhookPayload);
      const signature = bmoni.generateWebhookSignature(rawPayload);

      await storage.logWebhookAsync({
        eventType: 'kyc.activated',
        payload: webhookPayload,
        signature,
        status: 'PROCESSED'
      });

      res.json({ result, owner: updatedOwner });
    } catch (err: any) {
      console.error('KYC submit error:', err);
      res.status(500).json({ error: err.message || 'KYC verification failed' });
    }
  });

  app.get('/api/kyc/status', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      res.json({ kycStatus: owner.kycStatus, owner });
    } catch (err: any) {
      console.error('KYC status error:', err);
      res.status(500).json({ error: 'Failed to fetch KYC status' });
    }
  });

  // 3. Wallet & Virtual Account
  app.get('/api/wallet/balance', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner || !owner.bmoniWalletId) {
        return res.json({
          availableBalance: 0,
          currency: 'NGN',
          virtualAccount: null,
          lastUpdated: new Date().toISOString()
        });
      }

      const availableBalance = await storage.getWalletBalanceAsync(owner.bmoniWalletId);
      res.json({
        walletId: owner.bmoniWalletId,
        currency: 'NGN',
        availableBalance,
        ledgerBalance: availableBalance,
        virtualAccount: owner.virtualAccount,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Wallet balance error:', err);
      res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  });

  app.post('/api/wallet/faucet', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner || !owner.bmoniWalletId) {
        return res.status(400).json({ error: 'No active wallet found' });
      }

      const { amount } = req.body;
      const creditAmount = Number(amount) || 100000;
      const updated = await storage.creditWalletAsync(owner.bmoniWalletId, creditAmount);

      const webhookPayload = {
        event: 'deposit.confirmed',
        walletId: owner.bmoniWalletId,
        amount: creditAmount,
        currency: 'NGN',
        reference: `NGN_FAUCET_${Date.now()}`,
        sender: 'BMONI Sandbox Faucet Dispenser',
        timestamp: new Date().toISOString()
      };
      const signature = bmoni.generateWebhookSignature(JSON.stringify(webhookPayload));

      await storage.logWebhookAsync({
        eventType: 'deposit.confirmed',
        payload: webhookPayload,
        signature,
        status: 'PROCESSED'
      });

      res.json({
        success: true,
        message: `Credited ₦${creditAmount.toLocaleString()} to company wallet`,
        newBalance: updated
      });
    } catch (err: any) {
      console.error('Faucet error:', err);
      res.status(500).json({ error: 'Failed to credit wallet' });
    }
  });

  // 4. Dashboard Stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const stats = await storage.getDashboardStatsAsync(owner.id);
      res.json(stats);
    } catch (err: any) {
      console.error('Dashboard stats error:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // 5. Employees & Invites
  app.get('/api/employees', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const employees = await storage.getEmployeesAsync(owner.id);
      res.json({ employees });
    } catch (err: any) {
      console.error('Employees list error:', err);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });

  app.get('/api/employees/:id', async (req, res) => {
    try {
      const employee = await storage.getEmployeeByIdAsync(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      const card = employee.card;
      const transactions = card ? await storage.getTransactionsAsync({ cardId: card.id }) : [];
      res.json({ employee, card, transactions });
    } catch (err: any) {
      console.error('Employee detail error:', err);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  });

  app.post('/api/employees/invite', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, email, department } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Employee name and email are required' });
      }

      const inviteRes = await bmoni.createInvite({
        name,
        email,
        ownerId: owner.id,
        companyName: owner.companyName
      });

      let qrCodeDataUrl = '';
      try {
        qrCodeDataUrl = await QRCode.toDataURL(inviteRes.inviteUrl, {
          margin: 1,
          width: 256,
          color: { dark: '#047857', light: '#ffffff' }
        });
      } catch (qrErr) {
        console.warn('QR code generation failed:', qrErr);
      }

      const employee = await storage.createEmployeeAsync({
        ownerId: owner.id,
        name,
        email,
        department: department || 'General Operations',
        inviteStatus: 'PENDING',
        bmoniInviteId: inviteRes.inviteId,
        bmoniLinkedUserId: null,
        inviteUrl: inviteRes.inviteUrl,
        qrCodeDataUrl
      });

      res.status(201).json({ employee });
    } catch (err: any) {
      console.error('Invite employee error:', err);
      res.status(500).json({ error: err.message || 'Failed to issue invite' });
    }
  });

  app.post('/api/employees/:id/simulate-link', async (req, res) => {
    try {
      const employee = await storage.getEmployeeByIdAsync(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const linkedUserId = `bmoni_usr_link_${Date.now().toString().slice(-4)}`;
      const updated = await storage.updateEmployeeAsync(employee.id, {
        inviteStatus: 'LINKED',
        bmoniLinkedUserId: linkedUserId
      });

      const webhookPayload = {
        event: 'invite.linked',
        inviteId: employee.bmoniInviteId,
        userId: linkedUserId,
        email: employee.email,
        name: employee.name,
        timestamp: new Date().toISOString()
      };
      const signature = bmoni.generateWebhookSignature(JSON.stringify(webhookPayload));

      await storage.logWebhookAsync({
        eventType: 'invite.linked',
        payload: webhookPayload,
        signature,
        status: 'PROCESSED'
      });

      res.json({ success: true, employee: updated });
    } catch (err: any) {
      console.error('Simulate link error:', err);
      res.status(500).json({ error: 'Failed to simulate link' });
    }
  });

  // 6. Virtual Cards Management
  app.post('/api/cards/issue', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId, limitAmount } = req.body;
      const employee = await storage.getEmployeeByIdAsync(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      if (employee.inviteStatus !== 'LINKED') {
        return res.status(400).json({
          error: 'Employee must onboard and link their BMONI account before a virtual card can be issued.'
        });
      }

      const limit = Number(limitAmount) || 50000;

      const cardRes = await bmoni.issueCard({
        linkedUserId: employee.bmoniLinkedUserId || 'bmoni_usr_demo',
        employeeName: employee.name,
        employeeEmail: employee.email,
        limitAmount: limit,
        currency: 'NGN'
      });

      const newCard = await storage.createCardAsync({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        bmoniCardId: cardRes.cardId,
        type: 'VIRTUAL',
        currency: 'NGN',
        limitAmount: limit,
        spentAmount: 0,
        status: 'ACTIVE',
        maskedPan: cardRes.maskedPan,
        expiryMonth: cardRes.expiryMonth,
        expiryYear: cardRes.expiryYear,
        cvv: cardRes.cvv
      });

      res.status(201).json({ card: newCard });
    } catch (err: any) {
      console.error('Issue card error:', err);
      res.status(500).json({ error: err.message || 'Failed to issue card' });
    }
  });

  app.post('/api/cards/:id/freeze', async (req, res) => {
    try {
      const card = await storage.getCardByIdAsync(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      await bmoni.setCardStatus(card.bmoniCardId, 'freeze');
      const updated = await storage.updateCardAsync(card.id, { status: 'FROZEN' });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      console.error('Freeze card error:', err);
      res.status(500).json({ error: err.message || 'Failed to freeze card' });
    }
  });

  app.post('/api/cards/:id/unfreeze', async (req, res) => {
    try {
      const card = await storage.getCardByIdAsync(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      await bmoni.setCardStatus(card.bmoniCardId, 'unfreeze');
      const updated = await storage.updateCardAsync(card.id, { status: 'ACTIVE' });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      console.error('Unfreeze card error:', err);
      res.status(500).json({ error: err.message || 'Failed to unfreeze card' });
    }
  });

  app.patch('/api/cards/:id/limit', async (req, res) => {
    try {
      const { limitAmount } = req.body;
      const card = await storage.getCardByIdAsync(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const limit = Number(limitAmount);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: 'Invalid limit amount' });
      }

      await bmoni.updateCardLimit(card.bmoniCardId, limit);
      const updated = await storage.updateCardAsync(card.id, { limitAmount: limit });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      console.error('Update limit error:', err);
      res.status(500).json({ error: err.message || 'Failed to update limit' });
    }
  });

  // 7. Transaction Simulator
  app.post('/api/transactions/simulate', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { cardId, amount, merchant, category } = req.body;
      const card = await storage.getCardByIdAsync(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const txAmount = Number(amount) || 15000;
      const companyWalletId = owner.bmoniWalletId || 'bmoni_wlt_ngn_984120';
      const walletBalance = await storage.getWalletBalanceAsync(companyWalletId);

      let status: 'SUCCESS' | 'DECLINED' = 'SUCCESS';
      let declinedReason: string | undefined;

      if (card.status === 'FROZEN') {
        status = 'DECLINED';
        declinedReason = 'Card is FROZEN by administrator.';
      } else if (card.spentAmount + txAmount > card.limitAmount) {
        status = 'DECLINED';
        declinedReason = `Transaction exceeds card limit (Limit: ₦${card.limitAmount.toLocaleString()}, Current Spent: ₦${card.spentAmount.toLocaleString()}).`;
      } else if (walletBalance < txAmount) {
        status = 'DECLINED';
        declinedReason = 'Company wallet has insufficient NGN balance.';
      }

      const tx = await storage.createTransactionAsync({
        cardId: card.id,
        employeeId: card.employeeId,
        employeeName: card.employeeName,
        bmoniTransactionId: `bmoni_tx_${Date.now().toString().slice(-6)}`,
        amount: txAmount,
        currency: 'NGN',
        merchant: merchant || 'POS Terminal Lekki Phase 1',
        category: category || 'Business Operations',
        status,
        declinedReason
      });

      if (status === 'SUCCESS') {
        await storage.debitWalletAsync(companyWalletId, txAmount);
        await storage.updateCardAsync(card.id, {
          spentAmount: card.spentAmount + txAmount,
          lastUsedAt: new Date().toISOString()
        });
      }

      const webhookPayload = {
        event: 'card.transaction',
        cardId: card.bmoniCardId,
        transactionId: tx.bmoniTransactionId,
        amount: txAmount,
        currency: 'NGN',
        merchant: tx.merchant,
        status: tx.status,
        declinedReason: tx.declinedReason,
        timestamp: tx.occurredAt
      };
      const signature = bmoni.generateWebhookSignature(JSON.stringify(webhookPayload));

      await storage.logWebhookAsync({
        eventType: 'card.transaction',
        payload: webhookPayload,
        signature,
        status: 'PROCESSED'
      });

      res.json({ transaction: tx, cardStatus: card.status });
    } catch (err: any) {
      console.error('Transaction simulate error:', err);
      res.status(500).json({ error: err.message || 'Failed to simulate transaction' });
    }
  });

  // 8. Reports API
  app.get('/api/reports', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId, cardId, status, search } = req.query as {
        employeeId?: string;
        cardId?: string;
        status?: string;
        search?: string;
      };

      const transactions = await storage.getTransactionsAsync({
        employeeId,
        cardId,
        status,
        search
      });

      const totalSuccessfulSpend = transactions
        .filter((t) => t.status === 'SUCCESS')
        .reduce((sum, t) => sum + t.amount, 0);

      const successfulCount = transactions.filter((t) => t.status === 'SUCCESS').length;
      const declinedCount = transactions.filter((t) => t.status === 'DECLINED').length;

      res.json({
        transactions,
        summary: {
          totalSuccessfulSpend,
          totalTransactions: transactions.length,
          successfulCount,
          declinedCount
        }
      });
    } catch (err: any) {
      console.error('Reports error:', err);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  // 9. Webhook Receiver Endpoint
  app.post('/api/webhooks/bmoni', async (req: any, res) => {
    try {
      const signature = (req.headers['x-bmoni-signature'] ||
        req.headers['x-signature'] ||
        req.headers['authorization']) as string;
      const payload = req.body;
      const rawString = req.rawBody || JSON.stringify(payload);

      console.log(`[BMONI Webhook Received] Event: ${payload?.event || payload?.type}`);

      const isVerified = bmoni.verifyWebhookSignature(rawString, signature);
      if (!isVerified && process.env.NODE_ENV === 'production' && !signature?.includes('demo')) {
        console.warn('Webhook signature mismatch in production');
      }

      const eventType = payload.event || payload.type;

      if (eventType === 'kyc.activated') {
        const userId = payload.userId;
        const owners = await storage.getOwnersAsync();
        const owner = owners.find((o) => o.bmoniUserId === userId);
        if (owner) {
          await storage.updateOwnerAsync(owner.id, { kycStatus: 'ACTIVE' });
        }
      } else if (eventType === 'invite.linked') {
        const inviteId = payload.inviteId;
        const employee = await storage.getEmployeeByInviteIdAsync(inviteId);
        if (employee) {
          await storage.updateEmployeeAsync(employee.id, {
            inviteStatus: 'LINKED',
            bmoniLinkedUserId: payload.userId || `bmoni_usr_link_${Date.now().toString().slice(-4)}`
          });
        }
      } else if (eventType === 'deposit.confirmed') {
        const walletId = payload.walletId;
        const amount = Number(payload.amount);
        if (walletId && amount > 0) {
          await storage.creditWalletAsync(walletId, amount);
        }
      } else if (eventType === 'card.transaction') {
        const card = await storage.getCardByBmoniIdAsync(payload.cardId);
        if (card && payload.transactionId) {
          const existing = await storage.getTransactionsAsync();
          const found = existing.find((t) => t.bmoniTransactionId === payload.transactionId);
          if (!found) {
            await storage.createTransactionAsync({
              cardId: card.id,
              employeeId: card.employeeId,
              employeeName: card.employeeName,
              bmoniTransactionId: payload.transactionId,
              amount: payload.amount,
              currency: 'NGN',
              merchant: payload.merchant || 'Merchant POS',
              category: 'Corporate Expense',
              status: payload.status || 'SUCCESS',
              declinedReason: payload.declinedReason
            });
          }
        }
      }

      const logged = await storage.logWebhookAsync({
        eventType: (eventType as any) || 'deposit.confirmed',
        payload,
        signature: signature || 'sha256=verified_sandbox',
        status: 'PROCESSED'
      });

      res.json({ received: true, event: eventType, logId: logged.id });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // 10. Webhooks Inspector & Reset Demo
  app.get('/api/webhooks/logs', async (req, res) => {
    try {
      const logs = await storage.getWebhookLogsAsync();
      res.json({ logs });
    } catch (err: any) {
      console.error('Webhook logs error:', err);
      res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
  });

  app.post('/api/system/reset-demo', async (req, res) => {
    try {
      const owner = await getAuthenticatedOwner(req);
      if (!owner) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await storage.resetToDemoAsync(owner.id);
      res.json({ success: true, message: 'Reset database to hackathon demo state.' });
    } catch (err: any) {
      console.error('Reset demo error:', err);
      res.status(500).json({ error: 'Failed to reset demo data' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Team Cards] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
