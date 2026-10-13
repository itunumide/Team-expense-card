import 'dotenv/config';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { storage } from '../server/storageConvex';
import type {
  Owner,
  Employee,
  Card,
  Transaction,
  WebhookLog,
} from '../src/types';

dotenv.config({ path: '.env.local' });

type SeedDb = {
  owners: Owner[];
  employees: Employee[];
  cards: Card[];
  transactions: Transaction[];
  webhooks: WebhookLog[];
  walletBalances: Record<string, number>;
};

function ownerFromRow(row: any): Owner {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    companyName: row.company_name,
    bmoniUserId: row.bmoni_user_id ?? null,
    bmoniWalletId: row.bmoni_wallet_id ?? null,
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
    bmoniLinkedUserId: row.bmoni_linked_user_id ?? null,
    inviteUrl: row.invite_url,
    qrCodeDataUrl: row.qr_code_data_url ?? undefined,
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
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at ?? undefined,
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
    declinedReason: row.declined_reason ?? undefined,
  };
}

function webhookFromRow(row: any): WebhookLog {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload ?? {},
    signature: row.signature,
    receivedAt: row.received_at,
    status: row.status,
  };
}

async function fetchTable(table: string): Promise<any[]> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!base || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) must be set');
  }
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed for ${table}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function fetchFromSupabase(): Promise<SeedDb> {
  console.log('Reading live data from Supabase REST API...');
  const [owners, employees, cards, transactions, walletRows, webhooks] = await Promise.all([
    fetchTable('owners'),
    fetchTable('employees'),
    fetchTable('cards'),
    fetchTable('transactions'),
    fetchTable('wallet_balances'),
    fetchTable('webhook_logs'),
  ]);

  const walletBalances: Record<string, number> = {};
  for (const row of walletRows) walletBalances[row.wallet_id] = row.balance;

  return {
    owners: owners.map(ownerFromRow),
    employees: employees.map(employeeFromRow),
    cards: cards.map(cardFromRow),
    transactions: transactions.map(transactionFromRow),
    webhooks: webhooks.map(webhookFromRow),
    walletBalances,
  };
}

function loadFromJson(file: string): SeedDb {
  console.log(`Reading snapshot from ${file}...`);
  const raw = JSON.parse(readFileSync(path.resolve(file), 'utf8')) as any;
  return {
    owners: (raw.owners ?? []) as Owner[],
    employees: (raw.employees ?? []) as Employee[],
    cards: (raw.cards ?? []) as Card[],
    transactions: (raw.transactions ?? []) as Transaction[],
    webhooks: (raw.webhooks ?? []) as WebhookLog[],
    walletBalances: (raw.walletBalances ?? {}) as Record<string, number>,
  };
}

async function main() {
  const force = process.argv.includes('--force');
  const fromSupabase = process.argv.includes('--from-supabase');
  const fileArgIndex = process.argv.indexOf('--file');
  const file = fileArgIndex !== -1 ? process.argv[fileArgIndex + 1] : 'data/teamcards_db.json';

  const existingOwners = await storage.getOwnersAsync();
  if (existingOwners.length > 0 && !force) {
    console.error(
      `Convex already contains ${existingOwners.length} owner(s). ` +
        'Re-run with --force to import anyway (may create duplicates).'
    );
    process.exit(1);
  }

  const db =
    fromSupabase || process.env.SUPABASE_URL
      ? await fetchFromSupabase()
      : loadFromJson(file);

  const ownerIdMap = new Map<string, string>();
  for (const owner of db.owners) {
    const { id: legacyId, createdAt: _createdAt, ...fields } = owner;
    const created = await storage.createOwnerAsync(fields);
    ownerIdMap.set(legacyId, created.id);
    console.log(`owner    ${legacyId} -> ${created.id} (${created.email})`);
  }

  const employeeIdMap = new Map<string, string>();
  for (const employee of db.employees) {
    const { id: legacyId, createdAt: _createdAt, card: _card, ...fields } = employee;
    const ownerId = ownerIdMap.get(fields.ownerId);
    if (!ownerId) {
      console.warn(`skipping employee ${legacyId}: owner ${fields.ownerId} not found`);
      continue;
    }
    const created = await storage.createEmployeeAsync({ ...fields, ownerId });
    employeeIdMap.set(legacyId, created.id);
    console.log(`employee ${legacyId} -> ${created.id} (${created.name})`);
  }

  const cardIdMap = new Map<string, string>();
  for (const card of db.cards) {
    const { id: legacyId, createdAt: _createdAt, ...fields } = card;
    const employeeId = employeeIdMap.get(fields.employeeId);
    if (!employeeId) {
      console.warn(`skipping card ${legacyId}: employee ${fields.employeeId} not found`);
      continue;
    }
    const created = await storage.createCardAsync({ ...fields, employeeId });
    cardIdMap.set(legacyId, created.id);
    console.log(`card     ${legacyId} -> ${created.id} (${created.maskedPan})`);
  }

  for (const tx of db.transactions) {
    const { id: legacyId, occurredAt: _occurredAt, ...fields } = tx;
    const cardId = cardIdMap.get(fields.cardId);
    const employeeId = employeeIdMap.get(fields.employeeId);
    if (!cardId || !employeeId) {
      console.warn(`skipping transaction ${legacyId}: unresolved card/employee reference`);
      continue;
    }
    const created = await storage.createTransactionAsync({ ...fields, cardId, employeeId });
    console.log(`tx       ${legacyId} -> ${created.id} (${created.merchant})`);
  }

  for (const webhook of db.webhooks) {
    const { id: _legacyId, receivedAt: _receivedAt, ...fields } = webhook;
    await storage.logWebhookAsync(fields);
    console.log(`webhook  logged (${fields.eventType})`);
  }

  for (const [walletId, balance] of Object.entries(db.walletBalances)) {
    await storage.setWalletBalanceAsync(walletId, balance);
    console.log(`wallet   ${walletId} = ${balance}`);
  }

  console.log('Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
