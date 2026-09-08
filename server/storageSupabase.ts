import { randomBytes } from 'node:crypto';
import { supabase } from './supabase';
import type {
  Owner,
  Employee,
  Card,
  Transaction,
  WebhookLog,
  DashboardStats,
  InviteStatus,
  CardStatus,
  TransactionStatus,
  VirtualAccount,
} from '../src/types';

function ownerFromRow(row: any): Owner {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    companyName: row.company_name,
    bmoniUserId: row.bmoni_user_id,
    bmoniWalletId: row.bmoni_wallet_id,
    kycStatus: row.kyc_status,
    kycDetails: row.kyc_details ?? undefined,
    virtualAccount: row.virtual_account ?? null,
    createdAt: row.created_at,
  };
}

function employeeFromRow(row: any): Employee {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    email: row.email,
    department: row.department,
    inviteStatus: row.invite_status,
    bmoniInviteId: row.bmoni_invite_id,
    bmoniLinkedUserId: row.bmoni_linked_user_id,
    inviteUrl: row.invite_url,
    qrCodeDataUrl: row.qr_code_data_url,
    createdAt: row.created_at,
  };
}

function cardFromRow(row: any): Card {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeEmail: row.employee_email,
    bmoniCardId: row.bmoni_card_id,
    type: row.type,
    currency: row.currency,
    limitAmount: row.limit_amount,
    spentAmount: row.spent_amount,
    status: row.status,
    maskedPan: row.masked_pan,
    expiryMonth: row.expiry_month,
    expiryYear: row.expiry_year,
    cvv: row.cvv,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  };
}

function transactionFromRow(row: any): Transaction {
  return {
    id: row.id,
    cardId: row.card_id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    bmoniTransactionId: row.bmoni_transaction_id,
    amount: row.amount,
    currency: row.currency,
    merchant: row.merchant,
    category: row.category,
    status: row.status,
    occurredAt: row.occurred_at,
    declinedReason: row.declined_reason,
  };
}

function webhookLogFromRow(row: any): WebhookLog {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    signature: row.signature,
    receivedAt: row.received_at,
    status: row.status,
  };
}

export const storage = {
  // Owners
  getOwners(): Owner[] {
    throw new Error('getOwners is async; use getOwnersAsync()');
  },

  async getOwnersAsync(): Promise<Owner[]> {
    const { data, error } = await supabase.from('owners').select('*');
    if (error) throw error;
    return (data ?? []).map(ownerFromRow);
  },

  getOwnerByEmail(email: string) {
    throw new Error('getOwnerByEmail is async; use getOwnerByEmailAsync()');
  },

  async getOwnerByEmailAsync(email: string): Promise<Owner | undefined> {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data ? ownerFromRow(data) : undefined;
  },

  getOwnerById(id: string) {
    throw new Error('getOwnerById is async; use getOwnerByIdAsync()');
  },

  async getOwnerByIdAsync(id: string): Promise<Owner | undefined> {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? ownerFromRow(data) : undefined;
  },

  createOwner(ownerData: Omit<Owner, 'id' | 'createdAt'>): Owner {
    throw new Error('createOwner is async; use createOwnerAsync()');
  },

  async createOwnerAsync(ownerData: Omit<Owner, 'id' | 'createdAt'>): Promise<Owner> {
    const payload = {
      id: `owner_${randomBytes(4).toString('hex')}`,
      name: ownerData.name,
      email: ownerData.email,
      company_name: ownerData.companyName,
      bmoni_user_id: ownerData.bmoniUserId,
      bmoni_wallet_id: ownerData.bmoniWalletId,
      kyc_status: ownerData.kycStatus,
      kyc_details: ownerData.kycDetails,
      virtual_account: ownerData.virtualAccount,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('owners')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return ownerFromRow(data);
  },

  updateOwner(id: string, updates: Partial<Owner>): Owner | null {
    throw new Error('updateOwner is async; use updateOwnerAsync()');
  },

  async updateOwnerAsync(id: string, updates: Partial<Owner>): Promise<Owner | null> {
    const payload: Record<string, any> = { ...updates };

    if ('companyName' in payload) {
      payload.company_name = payload.companyName;
      delete payload.companyName;
    }
    if ('bmoniUserId' in payload) {
      payload.bmoni_user_id = payload.bmoniUserId;
      delete payload.bmoniUserId;
    }
    if ('bmoniWalletId' in payload) {
      payload.bmoni_wallet_id = payload.bmoniWalletId;
      delete payload.bmoniWalletId;
    }
    if ('kycStatus' in payload) {
      payload.kyc_status = payload.kycStatus;
      delete payload.kycStatus;
    }
    if ('kycDetails' in payload) {
      payload.kyc_details = payload.kycDetails;
      delete payload.kycDetails;
    }
    if ('virtualAccount' in payload) {
      payload.virtual_account = payload.virtualAccount;
      delete payload.virtualAccount;
    }
    if ('createdAt' in payload) {
      payload.created_at = payload.createdAt;
      delete payload.createdAt;
    }

    const { data, error } = await supabase
      .from('owners')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data ? ownerFromRow(data) : null;
  },

  // Wallet
  getWalletBalance(walletId: string): number {
    throw new Error('getWalletBalance is async; use getWalletBalanceAsync()');
  },

  async getWalletBalanceAsync(walletId: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('balance')
      .eq('wallet_id', walletId)
      .maybeSingle();

    if (error) throw error;
    return data?.balance ?? 0;
  },

  setWalletBalance(walletId: string, amount: number): number {
    throw new Error('setWalletBalance is async; use setWalletBalanceAsync()');
  },

  async setWalletBalanceAsync(walletId: string, amount: number): Promise<number> {
    const { error } = await supabase
      .from('wallet_balances')
      .upsert({ wallet_id: walletId, balance: amount });

    if (error) throw error;
    return amount;
  },

  creditWallet(walletId: string, amount: number): number {
    throw new Error('creditWallet is async; use creditWalletAsync()');
  },

  async creditWalletAsync(walletId: string, amount: number): Promise<number> {
    const current = await storage.getWalletBalanceAsync(walletId);
    const updated = current + amount;

    const { error } = await supabase
      .from('wallet_balances')
      .upsert({ wallet_id: walletId, balance: updated });

    if (error) throw error;
    return updated;
  },

  debitWallet(walletId: string, amount: number): boolean {
    throw new Error('debitWallet is async; use debitWalletAsync()');
  },

  async debitWalletAsync(walletId: string, amount: number): Promise<boolean> {
    const current = await storage.getWalletBalanceAsync(walletId);
    if (current < amount) return false;

    const updated = current - amount;
    const { error } = await supabase
      .from('wallet_balances')
      .upsert({ wallet_id: walletId, balance: updated });

    if (error) throw error;
    return true;
  },

  // Employees
  getEmployees(ownerId?: string): Employee[] {
    throw new Error('getEmployees is async; use getEmployeesAsync()');
  },

  async getEmployeesAsync(ownerId?: string): Promise<Employee[]> {
    let query = supabase.from('employees').select('*');

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const employeeIds = rows.map((row) => row.id);
    const cards = employeeIds.length
      ? ((await supabase.from('cards').select('*').in('employee_id', employeeIds)).data ?? [])
      : [];
    const cardMap = new Map(cards.map((card) => [card.employee_id, card]));

    return rows.map((row) => {
      const employee = employeeFromRow(row);
      const card = cardMap.get(employee.id);
      return card ? { ...employee, card: cardFromRow(card) } : employee;
    });
  },

  getEmployeeById(id: string) {
    throw new Error('getEmployeeById is async; use getEmployeeByIdAsync()');
  },

  async getEmployeeByIdAsync(id: string): Promise<Employee | undefined> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    const employee = employeeFromRow(data);
    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('employee_id', employee.id)
      .maybeSingle();

    return cardData ? { ...employee, card: cardFromRow(cardData) } : employee;
  },

  getEmployeeByInviteId(inviteId: string) {
    throw new Error('getEmployeeByInviteId is async; use getEmployeeByInviteIdAsync()');
  },

  async getEmployeeByInviteIdAsync(inviteId: string): Promise<Employee | undefined> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('bmoni_invite_id', inviteId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    const employee = employeeFromRow(data);
    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('employee_id', employee.id)
      .maybeSingle();

    return cardData ? { ...employee, card: cardFromRow(cardData) } : employee;
  },

  createEmployee(empData: Omit<Employee, 'id' | 'createdAt'>): Employee {
    throw new Error('createEmployee is async; use createEmployeeAsync()');
  },

  async createEmployeeAsync(empData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
    const payload = {
      id: `emp_${randomBytes(4).toString('hex')}`,
      owner_id: empData.ownerId,
      name: empData.name,
      email: empData.email,
      department: empData.department,
      invite_status: empData.inviteStatus,
      bmoni_invite_id: empData.bmoniInviteId,
      bmoni_linked_user_id: empData.bmoniLinkedUserId,
      invite_url: empData.inviteUrl,
      qr_code_data_url: empData.qrCodeDataUrl,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return employeeFromRow(data);
  },

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    throw new Error('updateEmployee is async; use updateEmployeeAsync()');
  },

  async updateEmployeeAsync(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const payload: Record<string, any> = { ...updates };

    if ('ownerId' in payload) {
      payload.owner_id = payload.ownerId;
      delete payload.ownerId;
    }
    if ('inviteStatus' in payload) {
      payload.invite_status = payload.inviteStatus;
      delete payload.inviteStatus;
    }
    if ('bmoniInviteId' in payload) {
      payload.bmoni_invite_id = payload.bmoniInviteId;
      delete payload.bmoniInviteId;
    }
    if ('bmoniLinkedUserId' in payload) {
      payload.bmoni_linked_user_id = payload.bmoniLinkedUserId;
      delete payload.bmoniLinkedUserId;
    }
    if ('inviteUrl' in payload) {
      payload.invite_url = payload.inviteUrl;
      delete payload.inviteUrl;
    }
    if ('qrCodeDataUrl' in payload) {
      payload.qr_code_data_url = payload.qrCodeDataUrl;
      delete payload.qrCodeDataUrl;
    }
    if ('createdAt' in payload) {
      payload.created_at = payload.createdAt;
      delete payload.createdAt;
    }

    const { data, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) return null;
    return storage.getEmployeeByIdAsync(id) ?? null;
  },

  // Cards
  getCards(): Card[] {
    throw new Error('getCards is async; use getCardsAsync()');
  },

  async getCardsAsync(): Promise<Card[]> {
    const { data, error } = await supabase.from('cards').select('*');
    if (error) throw error;
    return (data ?? []).map(cardFromRow);
  },

  getCardById(id: string) {
    throw new Error('getCardById is async; use getCardByIdAsync()');
  },

  async getCardByIdAsync(id: string): Promise<Card | undefined> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? cardFromRow(data) : undefined;
  },

  getCardByBmoniId(bmoniCardId: string) {
    throw new Error('getCardByBmoniId is async; use getCardByBmoniIdAsync()');
  },

  async getCardByBmoniIdAsync(bmoniCardId: string): Promise<Card | undefined> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('bmoni_card_id', bmoniCardId)
      .maybeSingle();

    if (error) throw error;
    return data ? cardFromRow(data) : undefined;
  },

  createCard(cardData: Omit<Card, 'id' | 'createdAt'>): Card {
    throw new Error('createCard is async; use createCardAsync()');
  },

  async createCardAsync(cardData: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
    const payload = {
      id: `crd_${randomBytes(4).toString('hex')}`,
      employee_id: cardData.employeeId,
      employee_name: cardData.employeeName,
      employee_email: cardData.employeeEmail,
      bmoni_card_id: cardData.bmoniCardId,
      type: cardData.type,
      currency: cardData.currency,
      limit_amount: cardData.limitAmount,
      spent_amount: cardData.spentAmount,
      status: cardData.status,
      masked_pan: cardData.maskedPan,
      expiry_month: cardData.expiryMonth,
      expiry_year: cardData.expiryYear,
      cvv: cardData.cvv,
      last_used_at: cardData.lastUsedAt,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cards')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return cardFromRow(data);
  },

  updateCard(id: string, updates: Partial<Card>): Card | null {
    throw new Error('updateCard is async; use updateCardAsync()');
  },

  async updateCardAsync(id: string, updates: Partial<Card>): Promise<Card | null> {
    const payload: Record<string, any> = { ...updates };

    if ('employeeId' in payload) {
      payload.employee_id = payload.employeeId;
      delete payload.employeeId;
    }
    if ('employeeName' in payload) {
      payload.employee_name = payload.employeeName;
      delete payload.employeeName;
    }
    if ('employeeEmail' in payload) {
      payload.employee_email = payload.employeeEmail;
      delete payload.employeeEmail;
    }
    if ('bmoniCardId' in payload) {
      payload.bmoni_card_id = payload.bmoniCardId;
      delete payload.bmoniCardId;
    }
    if ('limitAmount' in payload) {
      payload.limit_amount = payload.limitAmount;
      delete payload.limitAmount;
    }
    if ('spentAmount' in payload) {
      payload.spent_amount = payload.spentAmount;
      delete payload.spentAmount;
    }
    if ('maskedPan' in payload) {
      payload.masked_pan = payload.maskedPan;
      delete payload.maskedPan;
    }
    if ('expiryMonth' in payload) {
      payload.expiry_month = payload.expiryMonth;
      delete payload.expiryMonth;
    }
    if ('expiryYear' in payload) {
      payload.expiry_year = payload.expiryYear;
      delete payload.expiryYear;
    }
    if ('lastUsedAt' in payload) {
      payload.last_used_at = payload.lastUsedAt;
      delete payload.lastUsedAt;
    }
    if ('createdAt' in payload) {
      payload.created_at = payload.createdAt;
      delete payload.createdAt;
    }

    const { data, error } = await supabase
      .from('cards')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data ? cardFromRow(data) : null;
  },

  // Transactions
  getTransactions(filters?: {
    employeeId?: string;
    cardId?: string;
    status?: string;
    search?: string;
  }): Transaction[] {
    throw new Error('getTransactions is async; use getTransactionsAsync()');
  },

  async getTransactionsAsync(filters?: {
    employeeId?: string;
    cardId?: string;
    status?: string;
    search?: string;
  }): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.cardId) {
      query = query.eq('card_id', filters.cardId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    let transactions = (data ?? []).map(transactionFromRow);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return transactions;
  },

  createTransaction(txData: Omit<Transaction, 'id' | 'occurredAt'>): Transaction {
    throw new Error('createTransaction is async; use createTransactionAsync()');
  },

  async createTransactionAsync(txData: Omit<Transaction, 'id' | 'occurredAt'>): Promise<Transaction> {
    const payload = {
      id: `tx_${randomBytes(4).toString('hex')}`,
      card_id: txData.cardId,
      employee_id: txData.employeeId,
      employee_name: txData.employeeName,
      bmoni_transaction_id: txData.bmoniTransactionId,
      amount: txData.amount,
      currency: txData.currency,
      merchant: txData.merchant,
      category: txData.category,
      status: txData.status,
      declined_reason: txData.declinedReason,
      occurred_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return transactionFromRow(data);
  },

  // Webhooks
  logWebhook(webhook: Omit<WebhookLog, 'id' | 'receivedAt'>): WebhookLog {
    throw new Error('logWebhook is async; use logWebhookAsync()');
  },

  async logWebhookAsync(webhook: Omit<WebhookLog, 'id' | 'receivedAt'>): Promise<WebhookLog> {
    const payload = {
      id: `wh_log_${randomBytes(4).toString('hex')}`,
      event_type: webhook.eventType,
      payload: webhook.payload,
      signature: webhook.signature,
      status: webhook.status,
      received_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('webhook_logs')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return webhookLogFromRow(data);
  },

  getWebhookLogs(): WebhookLog[] {
    throw new Error('getWebhookLogs is async; use getWebhookLogsAsync()');
  },

  async getWebhookLogsAsync(): Promise<WebhookLog[]> {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(webhookLogFromRow);
  },

  // Dashboard Stats
  getDashboardStats(ownerId: string): DashboardStats {
    throw new Error('getDashboardStats is async; use getDashboardStatsAsync()');
  },

  async getDashboardStatsAsync(ownerId: string): Promise<DashboardStats> {
    const owner = await storage.getOwnerByIdAsync(ownerId);
    if (!owner) {
      const owners = await storage.getOwnersAsync();
      if (owners.length === 0) {
        throw new Error('No owner found');
      }
    }

    const employees = await storage.getEmployeesAsync(ownerId);
    const linkedEmployees = employees.filter((e) => e.inviteStatus === 'LINKED');
    const employeeIds = employees.map((e) => e.id);

    let cards: Card[] = [];
    if (employeeIds.length > 0) {
      const allCards = await storage.getCardsAsync();
      cards = allCards.filter((c) => employeeIds.includes(c.employeeId));
    }
    const activeCards = cards.filter((c) => c.status === 'ACTIVE');
    const frozenCards = cards.filter((c) => c.status === 'FROZEN');

    const walletBalance = owner?.bmoniWalletId
      ? await storage.getWalletBalanceAsync(owner.bmoniWalletId)
      : 0;

    const cardIds = cards.map((c) => c.id);
    const allTransactions = await storage.getTransactionsAsync();
    const ownerTransactions = allTransactions.filter((t) => cardIds.includes(t.cardId));

    const recentTransactions = ownerTransactions.slice(0, 10);

    const oneWeekAgo = Date.now() - 7 * 86400000;
    const weeklySpend = ownerTransactions
      .filter((t) => t.status === 'SUCCESS' && new Date(t.occurredAt).getTime() >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpend = ownerTransactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      walletBalance,
      employeesCount: employees.length,
      linkedEmployeesCount: linkedEmployees.length,
      activeCardsCount: activeCards.length,
      frozenCardsCount: frozenCards.length,
      weeklySpend,
      totalSpend,
      recentTransactions,
      virtualAccount: owner?.virtualAccount ?? null,
    };
  },

  // Demo reset
  async resetToDemoAsync(ownerId: string): Promise<void> {
    const owner = await storage.getOwnerByIdAsync(ownerId);
    if (!owner) {
      throw new Error('Owner not found');
    }

    const existingEmployees = await storage.getEmployeesAsync(ownerId);
    const employeeIds = existingEmployees.map((e) => e.id);

    if (employeeIds.length > 0) {
      const allCards = await storage.getCardsAsync();
      const ownerCardIds = allCards
        .filter((c) => employeeIds.includes(c.employeeId))
        .map((c) => c.id);

      if (ownerCardIds.length > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .delete()
          .in('card_id', ownerCardIds);

        if (txError) throw txError;
      }

      const { error: cardError } = await supabase
        .from('cards')
        .delete()
        .in('employee_id', employeeIds);

      if (cardError) throw cardError;
    }

    const { error: empError } = await supabase
      .from('employees')
      .delete()
      .eq('owner_id', ownerId);

    if (empError) throw empError;

    const now = new Date().toISOString();

    const employeesToInsert = [
      {
        id: `emp_${randomBytes(4).toString('hex')}`,
        owner_id: ownerId,
        name: 'Tunde Bakare',
        email: 'tunde@acme.ng',
        department: 'Engineering & DevOps',
        invite_status: 'LINKED',
        bmoni_invite_id: `inv_${randomBytes(3).toString('hex')}`,
        bmoni_linked_user_id: 'bmoni_usr_link_501',
        invite_url: 'https://bmoni.app/invite/inv_tunde',
        qr_code_data_url: null,
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: `emp_${randomBytes(4).toString('hex')}`,
        owner_id: ownerId,
        name: 'Chioma Eze',
        email: 'chioma@acme.ng',
        department: 'Sales & Growth',
        invite_status: 'LINKED',
        bmoni_invite_id: `inv_${randomBytes(3).toString('hex')}`,
        bmoni_linked_user_id: 'bmoni_usr_link_502',
        invite_url: 'https://bmoni.app/invite/inv_chioma',
        qr_code_data_url: null,
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      {
        id: `emp_${randomBytes(4).toString('hex')}`,
        owner_id: ownerId,
        name: 'Emeka Obi',
        email: 'emeka@acme.ng',
        department: 'Field Operations',
        invite_status: 'PENDING',
        bmoni_invite_id: `inv_${randomBytes(3).toString('hex')}`,
        bmoni_linked_user_id: null,
        invite_url: 'https://bmoni.app/invite/inv_emeka',
        qr_code_data_url: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: `emp_${randomBytes(4).toString('hex')}`,
        owner_id: ownerId,
        name: 'Fatima Danjuma',
        email: 'fatima@acme.ng',
        department: 'Finance & Admin',
        invite_status: 'LINKED',
        bmoni_invite_id: `inv_${randomBytes(3).toString('hex')}`,
        bmoni_linked_user_id: 'bmoni_usr_link_504',
        invite_url: 'https://bmoni.app/invite/inv_fatima',
        qr_code_data_url: null,
        created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ];

    const { data: insertedEmployees, error: insertEmpError } = await supabase
      .from('employees')
      .insert(employeesToInsert)
      .select('*');

    if (insertEmpError) throw insertEmpError;
    if (!insertedEmployees) throw new Error('Failed to insert demo employees');

    const employeeMap = new Map(insertedEmployees.map((e) => [e.name, employeeFromRow(e)]));

    const cardsToInsert = [
      {
        id: `crd_${randomBytes(4).toString('hex')}`,
        employee_id: employeeMap.get('Tunde Bakare')!.id,
        employee_name: 'Tunde Bakare',
        employee_email: 'tunde@acme.ng',
        bmoni_card_id: `bmoni_crd_${randomBytes(4).toString('hex')}`,
        type: 'VIRTUAL',
        currency: 'NGN',
        limit_amount: 150000,
        spent_amount: 84200,
        status: 'ACTIVE',
        masked_pan: '5399 •••• •••• 4821',
        expiry_month: '08',
        expiry_year: '28',
        cvv: '624',
        last_used_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: `crd_${randomBytes(4).toString('hex')}`,
        employee_id: employeeMap.get('Chioma Eze')!.id,
        employee_name: 'Chioma Eze',
        employee_email: 'chioma@acme.ng',
        bmoni_card_id: `bmoni_crd_${randomBytes(4).toString('hex')}`,
        type: 'VIRTUAL',
        currency: 'NGN',
        limit_amount: 75000,
        spent_amount: 29500,
        status: 'ACTIVE',
        masked_pan: '5399 •••• •••• 9104',
        expiry_month: '09',
        expiry_year: '28',
        cvv: '811',
        last_used_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: `crd_${randomBytes(4).toString('hex')}`,
        employee_id: employeeMap.get('Fatima Danjuma')!.id,
        employee_name: 'Fatima Danjuma',
        employee_email: 'fatima@acme.ng',
        bmoni_card_id: `bmoni_crd_${randomBytes(4).toString('hex')}`,
        type: 'VIRTUAL',
        currency: 'NGN',
        limit_amount: 50000,
        spent_amount: 12000,
        status: 'FROZEN',
        masked_pan: '5399 •••• •••• 3042',
        expiry_month: '11',
        expiry_year: '28',
        cvv: '190',
        last_used_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];

    const { data: insertedCards, error: insertCardError } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select('*');

    if (insertCardError) throw insertCardError;
    if (!insertedCards) throw new Error('Failed to insert demo cards');

    const cardMap = new Map(insertedCards.map((c) => [c.employee_name, cardFromRow(c)]));

    const transactionsToInsert = [
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Tunde Bakare')!.id,
        employee_id: employeeMap.get('Tunde Bakare')!.id,
        employee_name: 'Tunde Bakare',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 45000,
        currency: 'NGN',
        merchant: 'AWS Cloud Services',
        category: 'Cloud & Infrastructure',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Tunde Bakare')!.id,
        employee_id: employeeMap.get('Tunde Bakare')!.id,
        employee_name: 'Tunde Bakare',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 14200,
        currency: 'NGN',
        merchant: 'Uber Nigeria Ride',
        category: 'Travel & Mobility',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 14 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Chioma Eze')!.id,
        employee_id: employeeMap.get('Chioma Eze')!.id,
        employee_name: 'Chioma Eze',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 25000,
        currency: 'NGN',
        merchant: 'TotalEnergies Fuel Station VI',
        category: 'Fuel & Transportation',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Tunde Bakare')!.id,
        employee_id: employeeMap.get('Tunde Bakare')!.id,
        employee_name: 'Tunde Bakare',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 25000,
        currency: 'NGN',
        merchant: 'GitHub Enterprise Subscription',
        category: 'Software & SaaS',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 28 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Chioma Eze')!.id,
        employee_id: employeeMap.get('Chioma Eze')!.id,
        employee_name: 'Chioma Eze',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 4500,
        currency: 'NGN',
        merchant: 'Chicken Republic Lekki',
        category: 'Meals & Entertainment',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 48 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Fatima Danjuma')!.id,
        employee_id: employeeMap.get('Fatima Danjuma')!.id,
        employee_name: 'Fatima Danjuma',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 12000,
        currency: 'NGN',
        merchant: 'Office Supplies Hub Ikeja',
        category: 'Office & Supplies',
        status: 'SUCCESS',
        occurred_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        declined_reason: null,
      },
      {
        id: `tx_${randomBytes(4).toString('hex')}`,
        card_id: cardMap.get('Fatima Danjuma')!.id,
        employee_id: employeeMap.get('Fatima Danjuma')!.id,
        employee_name: 'Fatima Danjuma',
        bmoni_transaction_id: `bmoni_tx_${randomBytes(4).toString('hex')}`,
        amount: 85000,
        currency: 'NGN',
        merchant: 'Jumia Tech Store',
        category: 'Equipment',
        status: 'DECLINED',
        occurred_at: new Date(Date.now() - 8 * 3600000).toISOString(),
        declined_reason: 'Card is currently FROZEN by administrator',
      },
    ];

    const { error: insertTxError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (insertTxError) throw insertTxError;

    await storage.setWalletBalanceAsync(owner.bmoniWalletId || `${ownerId}_wallet`, 875000);
  },
};
