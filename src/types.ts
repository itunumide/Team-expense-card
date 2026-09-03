export type InviteStatus = 'PENDING' | 'LINKED' | 'EXPIRED';
export type CardStatus = 'ACTIVE' | 'FROZEN' | 'TERMINATED';
export type KycStatus = 'UNINITIALIZED' | 'PENDING' | 'ACTIVE' | 'FAILED';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'DECLINED';

export interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  currency: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  companyName: string;
  bmoniUserId: string | null;
  bmoniWalletId: string | null;
  kycStatus: KycStatus;
  kycDetails?: {
    bvn: string;
    phone: string;
    dob: string;
    address?: string;
  };
  virtualAccount: VirtualAccount | null;
  createdAt: string;
}

export interface Card {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  bmoniCardId: string;
  type: 'VIRTUAL';
  currency: 'NGN';
  limitAmount: number;
  spentAmount: number;
  status: CardStatus;
  maskedPan: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Employee {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  department: string;
  inviteStatus: InviteStatus;
  bmoniInviteId: string;
  bmoniLinkedUserId: string | null;
  inviteUrl: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  card?: Card;
}

export interface Transaction {
  id: string;
  cardId: string;
  employeeId: string;
  employeeName: string;
  bmoniTransactionId: string;
  amount: number;
  currency: 'NGN';
  merchant: string;
  category: string;
  status: TransactionStatus;
  occurredAt: string;
  declinedReason?: string;
}

export interface WebhookLog {
  id: string;
  eventType: 'kyc.activated' | 'invite.linked' | 'deposit.confirmed' | 'card.transaction';
  payload: Record<string, any>;
  signature: string;
  receivedAt: string;
  status: 'PROCESSED' | 'FAILED';
}

export interface WalletBalanceResponse {
  walletId: string;
  currency: 'NGN' | 'CNGN';
  availableBalance: number;
  ledgerBalance: number;
  virtualAccount: VirtualAccount;
  lastUpdated: string;
}

export interface DashboardStats {
  walletBalance: number;
  employeesCount: number;
  linkedEmployeesCount: number;
  activeCardsCount: number;
  frozenCardsCount: number;
  weeklySpend: number;
  totalSpend: number;
  recentTransactions: Transaction[];
  virtualAccount: VirtualAccount | null;
}

export interface BmoniTestIdentity {
  bvn: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  description: string;
}
