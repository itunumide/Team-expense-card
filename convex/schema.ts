import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const kycStatus = v.union(
  v.literal("UNINITIALIZED"),
  v.literal("PENDING"),
  v.literal("ACTIVE"),
  v.literal("FAILED"),
);

const virtualAccount = v.object({
  accountNumber: v.string(),
  bankName: v.string(),
  accountName: v.string(),
  currency: v.string(),
});

const kycDetails = v.object({
  bvn: v.string(),
  phone: v.string(),
  dob: v.string(),
  address: v.optional(v.string()),
});

const inviteStatus = v.union(
  v.literal("PENDING"),
  v.literal("LINKED"),
  v.literal("EXPIRED"),
);

const cardStatus = v.union(
  v.literal("ACTIVE"),
  v.literal("FROZEN"),
  v.literal("TERMINATED"),
);

const transactionStatus = v.union(
  v.literal("SUCCESS"),
  v.literal("PENDING"),
  v.literal("DECLINED"),
);

export default defineSchema({
  owners: defineTable({
    name: v.string(),
    email: v.string(),
    companyName: v.string(),
    bmoniUserId: v.union(v.string(), v.null()),
    bmoniWalletId: v.union(v.string(), v.null()),
    kycStatus,
    kycDetails: v.optional(kycDetails),
    virtualAccount: v.union(virtualAccount, v.null()),
  })
    .index("by_email", ["email"])
    .index("by_bmoni_user_id", ["bmoniUserId"]),

  employees: defineTable({
    ownerId: v.id("owners"),
    name: v.string(),
    email: v.string(),
    department: v.string(),
    inviteStatus,
    bmoniInviteId: v.string(),
    bmoniLinkedUserId: v.union(v.string(), v.null()),
    inviteUrl: v.string(),
    qrCodeDataUrl: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_bmoni_invite_id", ["bmoniInviteId"]),

  cards: defineTable({
    employeeId: v.id("employees"),
    employeeName: v.string(),
    employeeEmail: v.string(),
    bmoniCardId: v.string(),
    type: v.literal("VIRTUAL"),
    currency: v.literal("NGN"),
    limitAmount: v.number(),
    spentAmount: v.number(),
    status: cardStatus,
    maskedPan: v.string(),
    expiryMonth: v.string(),
    expiryYear: v.string(),
    cvv: v.string(),
    lastUsedAt: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_bmoni_card_id", ["bmoniCardId"]),

  transactions: defineTable({
    cardId: v.id("cards"),
    employeeId: v.id("employees"),
    employeeName: v.string(),
    bmoniTransactionId: v.string(),
    amount: v.number(),
    currency: v.literal("NGN"),
    merchant: v.string(),
    category: v.string(),
    status: transactionStatus,
    declinedReason: v.optional(v.string()),
    occurredAt: v.string(),
  })
    .index("by_card", ["cardId"])
    .index("by_employee", ["employeeId"])
    .index("by_bmoni_transaction_id", ["bmoniTransactionId"]),

  walletBalances: defineTable({
    walletId: v.string(),
    balance: v.number(),
  }).index("by_wallet_id", ["walletId"]),

  webhookLogs: defineTable({
    eventType: v.union(
      v.literal("kyc.activated"),
      v.literal("invite.linked"),
      v.literal("deposit.confirmed"),
      v.literal("card.transaction"),
    ),
    payload: v.any(),
    signature: v.string(),
    status: v.union(v.literal("PROCESSED"), v.literal("FAILED")),
  }),
});
