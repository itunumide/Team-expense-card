import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  VirtualAccount
} from '../src/types';

interface DatabaseSchema {
  owners: Owner[];
  employees: Employee[];
  cards: Card[];
  transactions: Transaction[];
  webhooks: WebhookLog[];
  walletBalances: Record<string, number>; // walletId -> balance in NGN
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'teamcards_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const initialOwnerId = 'owner_demo_001';
  const initialWalletId = 'bmoni_wlt_ngn_984120';
  const initialUserId = 'bmoni_usr_998124';

  const defaultVirtualAccount: VirtualAccount = {
    accountNumber: '9920184421',
    bankName: 'Providus Bank',
    accountName: 'BMONI / Acme Logistics Tech Ltd',
    currency: 'NGN'
  };

  const defaultOwner: Owner = {
    id: initialOwnerId,
    name: 'Adewale Adeleke',
    email: 'adewale@acme.ng',
    companyName: 'Acme Logistics Ltd',
    bmoniUserId: initialUserId,
    bmoniWalletId: initialWalletId,
    kycStatus: 'ACTIVE',
    kycDetails: {
      bvn: '22233344455',
      phone: '+2348031234567',
      dob: '1988-06-14',
      address: '14 Admiralty Way, Lekki Phase 1, Lagos'
    },
    virtualAccount: defaultVirtualAccount,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  };

  const emp1Id = 'emp_101';
  const emp2Id = 'emp_102';
  const emp3Id = 'emp_103';
  const emp4Id = 'emp_104';

  const card1: Card = {
    id: 'crd_701',
    employeeId: emp1Id,
    employeeName: 'Tunde Bakare',
    employeeEmail: 'tunde@acme.ng',
    bmoniCardId: 'bmoni_crd_ngn_88192',
    type: 'VIRTUAL',
    currency: 'NGN',
    limitAmount: 150000,
    spentAmount: 84200,
    status: 'ACTIVE',
    maskedPan: '5399 •••• •••• 4821',
    expiryMonth: '08',
    expiryYear: '28',
    cvv: '624',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 2 * 3600000).toISOString()
  };

  const card2: Card = {
    id: 'crd_702',
    employeeId: emp2Id,
    employeeName: 'Chioma Eze',
    employeeEmail: 'chioma@acme.ng',
    bmoniCardId: 'bmoni_crd_ngn_88193',
    type: 'VIRTUAL',
    currency: 'NGN',
    limitAmount: 75000,
    spentAmount: 29500,
    status: 'ACTIVE',
    maskedPan: '5399 •••• •••• 9104',
    expiryMonth: '09',
    expiryYear: '28',
    cvv: '811',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 5 * 3600000).toISOString()
  };

  const card4: Card = {
    id: 'crd_704',
    employeeId: emp4Id,
    employeeName: 'Fatima Danjuma',
    employeeEmail: 'fatima@acme.ng',
    bmoniCardId: 'bmoni_crd_ngn_88195',
    type: 'VIRTUAL',
    currency: 'NGN',
    limitAmount: 50000,
    spentAmount: 12000,
    status: 'FROZEN',
    maskedPan: '5399 •••• •••• 3042',
    expiryMonth: '11',
    expiryYear: '28',
    cvv: '190',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 24 * 3600000).toISOString()
  };

  const employees: Employee[] = [
    {
      id: emp1Id,
      ownerId: initialOwnerId,
      name: 'Tunde Bakare',
      email: 'tunde@acme.ng',
      department: 'Engineering & DevOps',
      inviteStatus: 'LINKED',
      bmoniInviteId: 'inv_bmoni_001',
      bmoniLinkedUserId: 'bmoni_usr_link_501',
      inviteUrl: 'https://bmoni.app/invite/inv_bmoni_001',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      card: card1
    },
    {
      id: emp2Id,
      ownerId: initialOwnerId,
      name: 'Chioma Eze',
      email: 'chioma@acme.ng',
      department: 'Sales & Growth',
      inviteStatus: 'LINKED',
      bmoniInviteId: 'inv_bmoni_002',
      bmoniLinkedUserId: 'bmoni_usr_link_502',
      inviteUrl: 'https://bmoni.app/invite/inv_bmoni_002',
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      card: card2
    },
    {
      id: emp3Id,
      ownerId: initialOwnerId,
      name: 'Emeka Obi',
      email: 'emeka@acme.ng',
      department: 'Field Operations',
      inviteStatus: 'PENDING',
      bmoniInviteId: 'inv_bmoni_003',
      bmoniLinkedUserId: null,
      inviteUrl: 'https://bmoni.app/invite/inv_bmoni_003',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: emp4Id,
      ownerId: initialOwnerId,
      name: 'Fatima Danjuma',
      email: 'fatima@acme.ng',
      department: 'Finance & Admin',
      inviteStatus: 'LINKED',
      bmoniInviteId: 'inv_bmoni_004',
      bmoniLinkedUserId: 'bmoni_usr_link_504',
      inviteUrl: 'https://bmoni.app/invite/inv_bmoni_004',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      card: card4
    }
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx_901',
      cardId: card1.id,
      employeeId: emp1Id,
      employeeName: 'Tunde Bakare',
      bmoniTransactionId: 'bmoni_tx_8801',
      amount: 45000,
      currency: 'NGN',
      merchant: 'AWS Cloud Services',
      category: 'Cloud & Infrastructure',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'tx_902',
      cardId: card1.id,
      employeeId: emp1Id,
      employeeName: 'Tunde Bakare',
      bmoniTransactionId: 'bmoni_tx_8802',
      amount: 14200,
      currency: 'NGN',
      merchant: 'Uber Nigeria Ride',
      category: 'Travel & Mobility',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 14 * 3600000).toISOString()
    },
    {
      id: 'tx_903',
      cardId: card2.id,
      employeeId: emp2Id,
      employeeName: 'Chioma Eze',
      bmoniTransactionId: 'bmoni_tx_8803',
      amount: 25000,
      currency: 'NGN',
      merchant: 'TotalEnergies Fuel Station VI',
      category: 'Fuel & Transportation',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
      id: 'tx_904',
      cardId: card1.id,
      employeeId: emp1Id,
      employeeName: 'Tunde Bakare',
      bmoniTransactionId: 'bmoni_tx_8804',
      amount: 25000,
      currency: 'NGN',
      merchant: 'GitHub Enterprise Subscription',
      category: 'Software & SaaS',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 28 * 3600000).toISOString()
    },
    {
      id: 'tx_905',
      cardId: card2.id,
      employeeId: emp2Id,
      employeeName: 'Chioma Eze',
      bmoniTransactionId: 'bmoni_tx_8805',
      amount: 4500,
      currency: 'NGN',
      merchant: 'Chicken Republic Lekki',
      category: 'Meals & Entertainment',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: 'tx_906',
      cardId: card4.id,
      employeeId: emp4Id,
      employeeName: 'Fatima Danjuma',
      bmoniTransactionId: 'bmoni_tx_8806',
      amount: 12000,
      currency: 'NGN',
      merchant: 'Office Supplies Hub Ikeja',
      category: 'Office & Supplies',
      status: 'SUCCESS',
      occurredAt: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'tx_907',
      cardId: card4.id,
      employeeId: emp4Id,
      employeeName: 'Fatima Danjuma',
      bmoniTransactionId: 'bmoni_tx_8807',
      amount: 85000,
      currency: 'NGN',
      merchant: 'Jumia Tech Store',
      category: 'Equipment',
      status: 'DECLINED',
      occurredAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      declinedReason: 'Card is currently FROZEN by administrator'
    }
  ];

  const defaultWebhooks: WebhookLog[] = [
    {
      id: 'wh_log_001',
      eventType: 'deposit.confirmed',
      payload: {
        event: 'deposit.confirmed',
        walletId: initialWalletId,
        amount: 500000,
        currency: 'NGN',
        reference: 'NGN_DEP_SANDBOX_9921',
        sender: 'Acme Corporate Settlement',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      signature: 'sha256=a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      receivedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'PROCESSED'
    },
    {
      id: 'wh_log_002',
      eventType: 'invite.linked',
      payload: {
        event: 'invite.linked',
        inviteId: 'inv_bmoni_001',
        userId: 'bmoni_usr_link_501',
        email: 'tunde@acme.ng',
        name: 'Tunde Bakare',
        timestamp: new Date(Date.now() - 11 * 86400000).toISOString()
      },
      signature: 'sha256=b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890a1',
      receivedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      status: 'PROCESSED'
    }
  ];

  return {
    owners: [defaultOwner],
    employees,
    cards: [card1, card2, card4],
    transactions,
    webhooks: defaultWebhooks,
    walletBalances: {
      [initialWalletId]: 875000 // ₦875,000 NGN balance
    }
  };
}

class Storage {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse DB file, restoring defaults:', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write DB file:', e);
    }
  }

  public resetToDemo(): void {
    this.data = getInitialData();
    this.saveData(this.data);
  }

  // Owners
  public getOwners(): Owner[] {
    return this.data.owners;
  }

  public getOwnerByEmail(email: string): Owner | undefined {
    return this.data.owners.find((o) => o.email.toLowerCase() === email.toLowerCase());
  }

  public getOwnerById(id: string): Owner | undefined {
    return this.data.owners.find((o) => o.id === id);
  }

  public createOwner(ownerData: Omit<Owner, 'id' | 'createdAt'>): Owner {
    const newOwner: Owner = {
      ...ownerData,
      id: `owner_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString()
    };
    this.data.owners.push(newOwner);
    this.saveData(this.data);
    return newOwner;
  }

  public updateOwner(id: string, updates: Partial<Owner>): Owner | null {
    const index = this.data.owners.findIndex((o) => o.id === id);
    if (index === -1) return null;
    this.data.owners[index] = { ...this.data.owners[index], ...updates };
    this.saveData(this.data);
    return this.data.owners[index];
  }

  // Wallet
  public getWalletBalance(walletId: string): number {
    return this.data.walletBalances[walletId] ?? 0;
  }

  public setWalletBalance(walletId: string, amount: number): number {
    this.data.walletBalances[walletId] = amount;
    this.saveData(this.data);
    return amount;
  }

  public creditWallet(walletId: string, amount: number): number {
    const current = this.getWalletBalance(walletId);
    const updated = current + amount;
    this.data.walletBalances[walletId] = updated;
    this.saveData(this.data);
    return updated;
  }

  public debitWallet(walletId: string, amount: number): boolean {
    const current = this.getWalletBalance(walletId);
    if (current < amount) return false;
    this.data.walletBalances[walletId] = current - amount;
    this.saveData(this.data);
    return true;
  }

  // Employees
  public getEmployees(ownerId?: string): Employee[] {
    let list = this.data.employees;
    if (ownerId) {
      list = list.filter((e) => e.ownerId === ownerId);
    }
    // Attach current card state
    return list.map((emp) => {
      const card = this.data.cards.find((c) => c.employeeId === emp.id);
      return { ...emp, card };
    });
  }

  public getEmployeeById(id: string): Employee | undefined {
    const emp = this.data.employees.find((e) => e.id === id);
    if (!emp) return undefined;
    const card = this.data.cards.find((c) => c.employeeId === emp.id);
    return { ...emp, card };
  }

  public getEmployeeByInviteId(inviteId: string): Employee | undefined {
    const emp = this.data.employees.find((e) => e.bmoniInviteId === inviteId);
    if (!emp) return undefined;
    const card = this.data.cards.find((c) => c.employeeId === emp.id);
    return { ...emp, card };
  }

  public createEmployee(empData: Omit<Employee, 'id' | 'createdAt'>): Employee {
    const newEmp: Employee = {
      ...empData,
      id: `emp_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString()
    };
    this.data.employees.push(newEmp);
    this.saveData(this.data);
    return newEmp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const index = this.data.employees.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.data.employees[index] = { ...this.data.employees[index], ...updates };
    this.saveData(this.data);
    return this.getEmployeeById(id) ?? null;
  }

  // Cards
  public getCards(): Card[] {
    return this.data.cards;
  }

  public getCardById(id: string): Card | undefined {
    return this.data.cards.find((c) => c.id === id);
  }

  public getCardByBmoniId(bmoniCardId: string): Card | undefined {
    return this.data.cards.find((c) => c.bmoniCardId === bmoniCardId);
  }

  public createCard(cardData: Omit<Card, 'id' | 'createdAt'>): Card {
    const newCard: Card = {
      ...cardData,
      id: `crd_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString()
    };
    this.data.cards.push(newCard);
    this.saveData(this.data);
    return newCard;
  }

  public updateCard(id: string, updates: Partial<Card>): Card | null {
    const index = this.data.cards.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.cards[index] = { ...this.data.cards[index], ...updates };
    this.saveData(this.data);
    return this.data.cards[index];
  }

  // Transactions
  public getTransactions(filters?: {
    employeeId?: string;
    cardId?: string;
    status?: string;
    search?: string;
  }): Transaction[] {
    let list = [...this.data.transactions].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    if (filters?.employeeId) {
      list = list.filter((t) => t.employeeId === filters.employeeId);
    }
    if (filters?.cardId) {
      list = list.filter((t) => t.cardId === filters.cardId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public createTransaction(txData: Omit<Transaction, 'id' | 'occurredAt'>): Transaction {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${crypto.randomBytes(4).toString('hex')}`,
      occurredAt: new Date().toISOString()
    };
    this.data.transactions.unshift(newTx);
    this.saveData(this.data);
    return newTx;
  }

  // Webhooks
  public logWebhook(webhook: Omit<WebhookLog, 'id' | 'receivedAt'>): WebhookLog {
    const newLog: WebhookLog = {
      ...webhook,
      id: `wh_log_${crypto.randomBytes(4).toString('hex')}`,
      receivedAt: new Date().toISOString()
    };
    this.data.webhooks.unshift(newLog);
    if (this.data.webhooks.length > 50) {
      this.data.webhooks.pop();
    }
    this.saveData(this.data);
    return newLog;
  }

  public getWebhookLogs(): WebhookLog[] {
    return this.data.webhooks;
  }

  // Dashboard Stats
  public getDashboardStats(ownerId: string): DashboardStats {
    const owner = this.getOwnerById(ownerId) || this.data.owners[0];
    const employees = this.getEmployees(owner?.id);
    const linkedEmployees = employees.filter((e) => e.inviteStatus === 'LINKED');
    const cards = this.data.cards;
    const activeCards = cards.filter((c) => c.status === 'ACTIVE');
    const frozenCards = cards.filter((c) => c.status === 'FROZEN');

    const walletBalance = owner?.bmoniWalletId
      ? this.getWalletBalance(owner.bmoniWalletId)
      : 0;

    const oneWeekAgo = Date.now() - 7 * 86400000;
    const recentTxs = this.data.transactions.slice(0, 10);

    const weeklySpend = this.data.transactions
      .filter((t) => t.status === 'SUCCESS' && new Date(t.occurredAt).getTime() >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpend = this.data.transactions
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
      recentTransactions: recentTxs,
      virtualAccount: owner?.virtualAccount ?? null
    };
  }
}

export const storage = new Storage();
