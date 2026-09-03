import express from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storage';
import { bmoni, BMONI_TEST_IDENTITIES } from './server/bmoni';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw buffer capturing for signature verification on webhooks
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // --- API Routes ---

  // 1. Auth & Session (Owner account)
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const owner = storage.getOwnerByEmail(email);
    if (!owner) {
      // Auto-fallback for demo if owner doesn't exist
      const firstOwner = storage.getOwners()[0];
      return res.json({ owner: firstOwner, token: 'demo_token_valid' });
    }
    return res.json({ owner, token: 'demo_token_valid' });
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, companyName, password } = req.body;
      if (!name || !email || !companyName) {
        return res.status(400).json({ error: 'Name, email, and company name are required' });
      }

      const existing = storage.getOwnerByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'An owner account with this email already exists' });
      }

      // 1. Create BMONI User
      const bmoniUser = await bmoni.createUser({ name, email });

      // 2. Provision NGN Company Wallet & Virtual Account
      const walletRes = await bmoni.provisionWallet(bmoniUser.userId, companyName);

      // 3. Save local Owner record
      const owner = storage.createOwner({
        name,
        email,
        companyName,
        bmoniUserId: bmoniUser.userId,
        bmoniWalletId: walletRes.walletId,
        kycStatus: 'UNINITIALIZED',
        virtualAccount: walletRes.virtualAccount
      });

      // Credit starter sandbox balance
      storage.setWalletBalance(walletRes.walletId, 500000);

      res.status(201).json({ owner });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: err.message || 'Failed to complete signup' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const owner = storage.getOwners()[0];
    if (!owner) {
      return res.status(404).json({ error: 'No owner found' });
    }
    res.json({ owner });
  });

  // 2. KYC Activation
  app.get('/api/kyc/test-identities', (_req, res) => {
    res.json({ identities: BMONI_TEST_IDENTITIES });
  });

  app.post('/api/kyc/submit', async (req, res) => {
    try {
      const { ownerId, bvn, firstName, lastName, dob, phone, address } = req.body;
      const owner = storage.getOwnerById(ownerId) || storage.getOwners()[0];
      if (!owner) {
        return res.status(404).json({ error: 'Owner record not found' });
      }

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
        storage.updateOwner(owner.id, { kycStatus: 'FAILED' });
        return res.status(400).json({
          error: result.message,
          errorCode: result.errorCode || 'ERR_KYC_FAILED'
        });
      }

      const updatedOwner = storage.updateOwner(owner.id, {
        kycStatus: result.status,
        kycDetails: { bvn, phone, dob, address }
      });

      // Trigger kyc.activated webhook log
      const webhookPayload = {
        event: 'kyc.activated',
        userId: owner.bmoniUserId,
        kycReference: result.kycReference,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      };
      const rawPayload = JSON.stringify(webhookPayload);
      const signature = bmoni.generateWebhookSignature(rawPayload);

      storage.logWebhook({
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

  app.get('/api/kyc/status', (req, res) => {
    const ownerId = req.query.ownerId as string;
    const owner = ownerId ? storage.getOwnerById(ownerId) : storage.getOwners()[0];
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    res.json({ kycStatus: owner.kycStatus, owner });
  });

  // 3. Wallet & Virtual Account
  app.get('/api/wallet/balance', (req, res) => {
    const owner = storage.getOwners()[0];
    if (!owner || !owner.bmoniWalletId) {
      return res.json({
        availableBalance: 0,
        currency: 'NGN',
        virtualAccount: null,
        lastUpdated: new Date().toISOString()
      });
    }

    const availableBalance = storage.getWalletBalance(owner.bmoniWalletId);
    res.json({
      walletId: owner.bmoniWalletId,
      currency: 'NGN',
      availableBalance,
      ledgerBalance: availableBalance,
      virtualAccount: owner.virtualAccount,
      lastUpdated: new Date().toISOString()
    });
  });

  // Faucet endpoint to credit sandbox tokens
  app.post('/api/wallet/faucet', (req, res) => {
    const { amount } = req.body;
    const creditAmount = Number(amount) || 100000;
    const owner = storage.getOwners()[0];
    if (!owner || !owner.bmoniWalletId) {
      return res.status(400).json({ error: 'No active wallet found' });
    }

    const updated = storage.creditWallet(owner.bmoniWalletId, creditAmount);

    // Also trigger deposit.confirmed webhook log
    const webhookPayload = {
      event: 'deposit.confirmed',
      walletId: owner.bmoniWalletId,
      amount: creditAmount,
      currency: 'NGN',
      reference: `NGN_FAUCET_${Date.now()}`,
      sender: 'BMONI Sandbox Faucet Dispenser',
      timestamp: new Date().toISOString()
    };
    const rawPayload = JSON.stringify(webhookPayload);
    const signature = bmoni.generateWebhookSignature(rawPayload);

    storage.logWebhook({
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
  });

  // 4. Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    const owner = storage.getOwners()[0];
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    const stats = storage.getDashboardStats(owner.id);
    res.json(stats);
  });

  // 5. Employees & Invites
  app.get('/api/employees', (req, res) => {
    const owner = storage.getOwners()[0];
    const employees = storage.getEmployees(owner?.id);
    res.json({ employees });
  });

  app.get('/api/employees/:id', (req, res) => {
    const employee = storage.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const card = employee.card;
    const transactions = card ? storage.getTransactions({ cardId: card.id }) : [];
    res.json({ employee, card, transactions });
  });

  app.post('/api/employees/invite', async (req, res) => {
    try {
      const { name, email, department } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Employee name and email are required' });
      }

      const owner = storage.getOwners()[0];
      if (!owner) {
        return res.status(400).json({ error: 'Owner session not found' });
      }

      // Call BMONI createInvite
      const inviteRes = await bmoni.createInvite({
        name,
        email,
        ownerId: owner.id,
        companyName: owner.companyName
      });

      // Generate QR Code data URL for instant mobile onboarding scan
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

      // Save local Employee record
      const employee = storage.createEmployee({
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

  // Stage Demo Helper: Simulate employee opening mobile app & linking account
  app.post('/api/employees/:id/simulate-link', (req, res) => {
    const employee = storage.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const linkedUserId = `bmoni_usr_link_${Date.now().toString().slice(-4)}`;
    const updated = storage.updateEmployee(employee.id, {
      inviteStatus: 'LINKED',
      bmoniLinkedUserId: linkedUserId
    });

    // Fire invite.linked webhook log
    const webhookPayload = {
      event: 'invite.linked',
      inviteId: employee.bmoniInviteId,
      userId: linkedUserId,
      email: employee.email,
      name: employee.name,
      timestamp: new Date().toISOString()
    };
    const signature = bmoni.generateWebhookSignature(JSON.stringify(webhookPayload));

    storage.logWebhook({
      eventType: 'invite.linked',
      payload: webhookPayload,
      signature,
      status: 'PROCESSED'
    });

    res.json({ success: true, employee: updated });
  });

  // 6. Virtual Cards Management
  app.post('/api/cards/issue', async (req, res) => {
    try {
      const { employeeId, limitAmount } = req.body;
      const employee = storage.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      if (employee.inviteStatus !== 'LINKED') {
        return res.status(400).json({
          error: 'Employee must onboard and link their BMONI account before a virtual card can be issued.'
        });
      }

      const limit = Number(limitAmount) || 50000;

      // Call BMONI Cards API
      const cardRes = await bmoni.issueCard({
        linkedUserId: employee.bmoniLinkedUserId || 'bmoni_usr_demo',
        employeeName: employee.name,
        employeeEmail: employee.email,
        limitAmount: limit,
        currency: 'NGN'
      });

      const newCard = storage.createCard({
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
      const card = storage.getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      await bmoni.setCardStatus(card.bmoniCardId, 'freeze');
      const updated = storage.updateCard(card.id, { status: 'FROZEN' });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to freeze card' });
    }
  });

  app.post('/api/cards/:id/unfreeze', async (req, res) => {
    try {
      const card = storage.getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      await bmoni.setCardStatus(card.bmoniCardId, 'unfreeze');
      const updated = storage.updateCard(card.id, { status: 'ACTIVE' });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to unfreeze card' });
    }
  });

  app.patch('/api/cards/:id/limit', async (req, res) => {
    try {
      const { limitAmount } = req.body;
      const card = storage.getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const limit = Number(limitAmount);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: 'Invalid limit amount' });
      }

      await bmoni.updateCardLimit(card.bmoniCardId, limit);
      const updated = storage.updateCard(card.id, { limitAmount: limit });

      res.json({ success: true, card: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update limit' });
    }
  });

  // 7. Transaction Simulator (For stage live demos)
  app.post('/api/transactions/simulate', (req, res) => {
    const { cardId, amount, merchant, category } = req.body;
    const card = storage.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const txAmount = Number(amount) || 15000;
    const owner = storage.getOwners()[0];
    const companyWalletId = owner?.bmoniWalletId || 'bmoni_wlt_ngn_984120';
    const walletBalance = storage.getWalletBalance(companyWalletId);

    // Validation checks
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

    const tx = storage.createTransaction({
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
      // Debit company wallet & update card spentAmount
      storage.debitWallet(companyWalletId, txAmount);
      storage.updateCard(card.id, {
        spentAmount: card.spentAmount + txAmount,
        lastUsedAt: new Date().toISOString()
      });
    }

    // Fire card.transaction webhook log
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

    storage.logWebhook({
      eventType: 'card.transaction',
      payload: webhookPayload,
      signature,
      status: 'PROCESSED'
    });

    res.json({ transaction: tx, cardStatus: card.status });
  });

  // 8. Reports API
  app.get('/api/reports', (req, res) => {
    const { employeeId, cardId, status, search } = req.query as {
      employeeId?: string;
      cardId?: string;
      status?: string;
      search?: string;
    };

    const transactions = storage.getTransactions({
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
  });

  // 9. Webhook Receiver Endpoint
  app.post('/api/webhooks/bmoni', (req: any, res) => {
    try {
      const signature = (req.headers['x-bmoni-signature'] ||
        req.headers['x-signature'] ||
        req.headers['authorization']) as string;
      const payload = req.body;
      const rawString = req.rawBody || JSON.stringify(payload);

      console.log(`[BMONI Webhook Received] Event: ${payload?.event || payload?.type}`);

      // Optional signature verification check with sandbox tolerance
      const isVerified = bmoni.verifyWebhookSignature(rawString, signature);
      if (!isVerified && process.env.NODE_ENV === 'production' && !signature?.includes('demo')) {
        console.warn('Webhook signature mismatch in production');
        // We log but don't crash hackathon demo
      }

      const eventType = payload.event || payload.type;

      // Handle events
      if (eventType === 'kyc.activated') {
        const userId = payload.userId;
        const owner = storage.getOwners().find((o) => o.bmoniUserId === userId);
        if (owner) {
          storage.updateOwner(owner.id, { kycStatus: 'ACTIVE' });
        }
      } else if (eventType === 'invite.linked') {
        const inviteId = payload.inviteId;
        const employee = storage.getEmployeeByInviteId(inviteId);
        if (employee) {
          storage.updateEmployee(employee.id, {
            inviteStatus: 'LINKED',
            bmoniLinkedUserId: payload.userId || `bmoni_usr_link_${Date.now().toString().slice(-4)}`
          });
        }
      } else if (eventType === 'deposit.confirmed') {
        const walletId = payload.walletId;
        const amount = Number(payload.amount);
        if (walletId && amount > 0) {
          storage.creditWallet(walletId, amount);
        }
      } else if (eventType === 'card.transaction') {
        // card transaction record
        const card = storage.getCardByBmoniId(payload.cardId);
        if (card && payload.transactionId) {
          const existing = storage.getTransactions().find((t) => t.bmoniTransactionId === payload.transactionId);
          if (!existing) {
            storage.createTransaction({
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

      const logged = storage.logWebhook({
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
  app.get('/api/webhooks/logs', (_req, res) => {
    res.json({ logs: storage.getWebhookLogs() });
  });

  app.post('/api/system/reset-demo', (_req, res) => {
    storage.resetToDemo();
    res.json({ success: true, message: 'Reset database to hackathon demo state.' });
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
