import type { Doc, Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { convexClient } from "./convex";
import type {
  Owner,
  Employee,
  Card,
  Transaction,
  WebhookLog,
  DashboardStats,
} from "../src/types";

function toOwner(doc: Doc<"owners">): Owner {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    companyName: doc.companyName,
    bmoniUserId: doc.bmoniUserId,
    bmoniWalletId: doc.bmoniWalletId,
    kycStatus: doc.kycStatus,
    kycDetails: doc.kycDetails,
    virtualAccount: doc.virtualAccount,
    createdAt: new Date(doc._creationTime).toISOString(),
  };
}

function toEmployee(
  employee: Doc<"employees">,
  card: Doc<"cards"> | null,
): Employee {
  const mapped: Employee = {
    id: employee._id,
    ownerId: employee.ownerId,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    inviteStatus: employee.inviteStatus,
    bmoniInviteId: employee.bmoniInviteId,
    bmoniLinkedUserId: employee.bmoniLinkedUserId,
    inviteUrl: employee.inviteUrl,
    qrCodeDataUrl: employee.qrCodeDataUrl,
    createdAt: new Date(employee._creationTime).toISOString(),
  };
  if (card) mapped.card = toCard(card);
  return mapped;
}

function toCard(doc: Doc<"cards">): Card {
  return {
    id: doc._id,
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    bmoniCardId: doc.bmoniCardId,
    type: doc.type,
    currency: doc.currency,
    limitAmount: doc.limitAmount,
    spentAmount: doc.spentAmount,
    status: doc.status,
    maskedPan: doc.maskedPan,
    expiryMonth: doc.expiryMonth,
    expiryYear: doc.expiryYear,
    cvv: doc.cvv,
    createdAt: new Date(doc._creationTime).toISOString(),
    lastUsedAt: doc.lastUsedAt,
  };
}

function toTransaction(doc: Doc<"transactions">): Transaction {
  return {
    id: doc._id,
    cardId: doc.cardId,
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    bmoniTransactionId: doc.bmoniTransactionId,
    amount: doc.amount,
    currency: doc.currency,
    merchant: doc.merchant,
    category: doc.category,
    status: doc.status,
    occurredAt: doc.occurredAt,
    declinedReason: doc.declinedReason,
  };
}

function toWebhookLog(doc: Doc<"webhookLogs">): WebhookLog {
  return {
    id: doc._id,
    eventType: doc.eventType,
    payload: doc.payload,
    signature: doc.signature,
    receivedAt: new Date(doc._creationTime).toISOString(),
    status: doc.status,
  };
}

export const storage = {
  // Owners
  async getOwnersAsync(): Promise<Owner[]> {
    const docs = await convexClient.query(api.owners.list, {});
    return docs.map(toOwner);
  },

  async getOwnerByEmailAsync(email: string): Promise<Owner | undefined> {
    const doc = await convexClient.query(api.owners.getByEmail, {
      email: email.toLowerCase(),
    });
    return doc ? toOwner(doc) : undefined;
  },

  async getOwnerByIdAsync(id: string): Promise<Owner | undefined> {
    const doc = await convexClient.query(api.owners.getById, {
      id: id as Id<"owners">,
    });
    return doc ? toOwner(doc) : undefined;
  },

  async getOwnerByBmoniUserIdAsync(bmoniUserId: string): Promise<Owner | undefined> {
    const doc = await convexClient.query(api.owners.getByBmoniUserId, {
      bmoniUserId,
    });
    return doc ? toOwner(doc) : undefined;
  },

  async createOwnerAsync(ownerData: Omit<Owner, "id" | "createdAt">): Promise<Owner> {
    const doc = await convexClient.mutation(api.owners.create, ownerData);
    if (!doc) throw new Error("Failed to create owner");
    return toOwner(doc);
  },

  async updateOwnerAsync(id: string, updates: Partial<Owner>): Promise<Owner | null> {
    const { id: _id, createdAt: _createdAt, ...patch } = updates;
    const doc = await convexClient.mutation(api.owners.update, {
      id: id as Id<"owners">,
      patch,
    });
    return doc ? toOwner(doc) : null;
  },

  // Wallet
  async getWalletBalanceAsync(walletId: string): Promise<number> {
    return await convexClient.query(api.wallets.getBalance, { walletId });
  },

  async setWalletBalanceAsync(walletId: string, amount: number): Promise<number> {
    return await convexClient.mutation(api.wallets.setBalance, {
      walletId,
      balance: amount,
    });
  },

  async creditWalletAsync(walletId: string, amount: number): Promise<number> {
    return await convexClient.mutation(api.wallets.credit, { walletId, amount });
  },

  async debitWalletAsync(walletId: string, amount: number): Promise<boolean> {
    return await convexClient.mutation(api.wallets.debit, { walletId, amount });
  },

  // Employees
  async getEmployeesAsync(ownerId?: string): Promise<Employee[]> {
    if (ownerId) {
      const rows = await convexClient.query(api.employees.listByOwner, {
        ownerId: ownerId as Id<"owners">,
      });
      return rows.map((row) => toEmployee(row.employee, row.card));
    }
    const rows = await convexClient.query(api.employees.list, {});
    return rows.map((row) => toEmployee(row.employee, row.card));
  },

  async getEmployeeByIdAsync(id: string): Promise<Employee | undefined> {
    const row = await convexClient.query(api.employees.getById, {
      id: id as Id<"employees">,
    });
    return row ? toEmployee(row.employee, row.card) : undefined;
  },

  async getEmployeeByInviteIdAsync(inviteId: string): Promise<Employee | undefined> {
    const row = await convexClient.query(api.employees.getByInviteId, { inviteId });
    return row ? toEmployee(row.employee, row.card) : undefined;
  },

  async createEmployeeAsync(empData: Omit<Employee, "id" | "createdAt">): Promise<Employee> {
    const { card: _card, ...fields } = empData;
    const doc = await convexClient.mutation(api.employees.create, {
      ...fields,
      ownerId: fields.ownerId as Id<"owners">,
    });
    if (!doc) throw new Error("Failed to create employee");
    return toEmployee(doc, null);
  },

  async updateEmployeeAsync(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const { id: _id, createdAt: _createdAt, card: _card, ...patch } = updates;
    const doc = await convexClient.mutation(api.employees.update, {
      id: id as Id<"employees">,
      patch: { ...patch, ownerId: patch.ownerId as Id<"owners"> | undefined },
    });
    if (!doc) return null;
    const row = await convexClient.query(api.employees.getById, {
      id: id as Id<"employees">,
    });
    return row ? toEmployee(row.employee, row.card) : null;
  },

  // Cards
  async getCardsAsync(): Promise<Card[]> {
    const docs = await convexClient.query(api.cards.list, {});
    return docs.map(toCard);
  },

  async getCardByIdAsync(id: string): Promise<Card | undefined> {
    const doc = await convexClient.query(api.cards.getById, { id: id as Id<"cards"> });
    return doc ? toCard(doc) : undefined;
  },

  async getCardByBmoniIdAsync(bmoniCardId: string): Promise<Card | undefined> {
    const doc = await convexClient.query(api.cards.getByBmoniId, { bmoniCardId });
    return doc ? toCard(doc) : undefined;
  },

  async createCardAsync(cardData: Omit<Card, "id" | "createdAt">): Promise<Card> {
    const doc = await convexClient.mutation(api.cards.create, {
      ...cardData,
      employeeId: cardData.employeeId as Id<"employees">,
    });
    if (!doc) throw new Error("Failed to create card");
    return toCard(doc);
  },

  async updateCardAsync(id: string, updates: Partial<Card>): Promise<Card | null> {
    const { id: _id, createdAt: _createdAt, ...patch } = updates;
    const doc = await convexClient.mutation(api.cards.update, {
      id: id as Id<"cards">,
      patch: { ...patch, employeeId: patch.employeeId as Id<"employees"> | undefined },
    });
    return doc ? toCard(doc) : null;
  },

  // Transactions
  async getTransactionsAsync(filters?: {
    employeeId?: string;
    cardId?: string;
    status?: string;
    search?: string;
  }): Promise<Transaction[]> {
    const docs = await convexClient.query(api.transactions.list, {
      employeeId: filters?.employeeId as Id<"employees"> | undefined,
      cardId: filters?.cardId as Id<"cards"> | undefined,
      status: filters?.status,
      search: filters?.search,
    });
    return docs.map(toTransaction);
  },

  async getTransactionByBmoniIdAsync(bmoniTransactionId: string): Promise<Transaction | undefined> {
    const doc = await convexClient.query(api.transactions.getByBmoniId, {
      bmoniTransactionId,
    });
    return doc ? toTransaction(doc) : undefined;
  },

  async createTransactionAsync(txData: Omit<Transaction, "id" | "occurredAt">): Promise<Transaction> {
    const doc = await convexClient.mutation(api.transactions.create, {
      ...txData,
      cardId: txData.cardId as Id<"cards">,
      employeeId: txData.employeeId as Id<"employees">,
      occurredAt: new Date().toISOString(),
    });
    if (!doc) throw new Error("Failed to create transaction");
    return toTransaction(doc);
  },

  // Webhooks
  async logWebhookAsync(webhook: Omit<WebhookLog, "id" | "receivedAt">): Promise<WebhookLog> {
    const doc = await convexClient.mutation(api.webhookLogs.create, webhook);
    if (!doc) throw new Error("Failed to log webhook");
    return toWebhookLog(doc);
  },

  async getWebhookLogsAsync(): Promise<WebhookLog[]> {
    const docs = await convexClient.query(api.webhookLogs.list, {});
    return docs.map(toWebhookLog);
  },

  // Dashboard Stats
  async getDashboardStatsAsync(ownerId: string): Promise<DashboardStats> {
    const stats = await convexClient.query(api.dashboard.getStats, {
      ownerId: ownerId as Id<"owners">,
      now: Date.now(),
    });
    return {
      ...stats,
      recentTransactions: stats.recentTransactions.map(toTransaction),
    };
  },

  // Demo reset
  async resetToDemoAsync(ownerId: string): Promise<void> {
    await convexClient.mutation(api.demo.reset, {
      ownerId: ownerId as Id<"owners">,
    });
  },
};
