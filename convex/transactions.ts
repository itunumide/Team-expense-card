import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const transactionStatus = v.union(
  v.literal("SUCCESS"),
  v.literal("PENDING"),
  v.literal("DECLINED"),
);

const transactionFields = {
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
};

export const list = query({
  args: {
    employeeId: v.optional(v.id("employees")),
    cardId: v.optional(v.id("cards")),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { cardId, employeeId } = args;
    let rows;
    if (cardId !== undefined) {
      rows = await ctx.db
        .query("transactions")
        .withIndex("by_card", (q) => q.eq("cardId", cardId))
        .take(2000);
    } else if (employeeId !== undefined) {
      rows = await ctx.db
        .query("transactions")
        .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
        .take(2000);
    } else {
      rows = await ctx.db.query("transactions").take(2000);
    }

    let transactions = rows;
    if (args.status !== undefined && args.status !== "ALL") {
      transactions = transactions.filter((t) => t.status === args.status);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    return transactions.sort((a, b) =>
      a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0,
    );
  },
});

export const getByBmoniId = query({
  args: { bmoniTransactionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_bmoni_transaction_id", (q) =>
        q.eq("bmoniTransactionId", args.bmoniTransactionId),
      )
      .first();
  },
});

export const create = mutation({
  args: transactionFields,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("transactions", args);
    return await ctx.db.get("transactions", id);
  },
});
