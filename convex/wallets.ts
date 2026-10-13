import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

async function readBalance(ctx: QueryCtx, walletId: string): Promise<number> {
  const row = await ctx.db
    .query("walletBalances")
    .withIndex("by_wallet_id", (q) => q.eq("walletId", walletId))
    .first();
  return row?.balance ?? 0;
}

async function writeBalance(
  ctx: MutationCtx,
  walletId: string,
  balance: number,
): Promise<void> {
  const row = await ctx.db
    .query("walletBalances")
    .withIndex("by_wallet_id", (q) => q.eq("walletId", walletId))
    .first();
  if (row) {
    await ctx.db.patch("walletBalances", row._id, { balance });
  } else {
    await ctx.db.insert("walletBalances", { walletId, balance });
  }
}

export const getBalance = query({
  args: { walletId: v.string() },
  handler: async (ctx, args) => {
    return await readBalance(ctx, args.walletId);
  },
});

export const setBalance = mutation({
  args: { walletId: v.string(), balance: v.number() },
  handler: async (ctx, args) => {
    await writeBalance(ctx, args.walletId, args.balance);
    return args.balance;
  },
});

export const credit = mutation({
  args: { walletId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const current = await readBalance(ctx, args.walletId);
    const updated = current + args.amount;
    await writeBalance(ctx, args.walletId, updated);
    return updated;
  },
});

export const debit = mutation({
  args: { walletId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const current = await readBalance(ctx, args.walletId);
    if (current < args.amount) return false;
    await writeBalance(ctx, args.walletId, current - args.amount);
    return true;
  },
});
