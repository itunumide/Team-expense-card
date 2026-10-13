import { query } from "./_generated/server";
import { v } from "convex/values";

const MAX_ROWS = 1000;

export const getStats = query({
  args: {
    ownerId: v.id("owners"),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const owner = await ctx.db.get("owners", args.ownerId);

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .take(MAX_ROWS);

    const cards = [];
    for (const employee of employees) {
      const card = await ctx.db
        .query("cards")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .first();
      if (card) cards.push(card);
    }

    const transactions = [];
    for (const card of cards) {
      const rows = await ctx.db
        .query("transactions")
        .withIndex("by_card", (q) => q.eq("cardId", card._id))
        .take(MAX_ROWS);
      transactions.push(...rows);
    }

    let walletBalance = 0;
    if (owner?.bmoniWalletId) {
      const wallet = await ctx.db
        .query("walletBalances")
        .withIndex("by_wallet_id", (q) => q.eq("walletId", owner.bmoniWalletId!))
        .first();
      walletBalance = wallet?.balance ?? 0;
    }

    const linkedEmployees = employees.filter((e) => e.inviteStatus === "LINKED");
    const activeCards = cards.filter((c) => c.status === "ACTIVE");
    const frozenCards = cards.filter((c) => c.status === "FROZEN");

    const oneWeekAgo = args.now - 7 * 86400000;
    const weeklySpend = transactions
      .filter((t) => t.status === "SUCCESS" && Date.parse(t.occurredAt) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpend = transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + t.amount, 0);

    const recentTransactions = [...transactions]
      .sort((a, b) =>
        a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0,
      )
      .slice(0, 10);

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
});
