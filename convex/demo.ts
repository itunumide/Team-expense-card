import { mutation } from "./_generated/server";
import { v } from "convex/values";

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

export const reset = mutation({
  args: { ownerId: v.id("owners") },
  handler: async (ctx, args) => {
    const owner = await ctx.db.get("owners", args.ownerId);
    if (!owner) throw new Error("Owner not found");

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .take(1000);

    for (const employee of employees) {
      const cards = await ctx.db
        .query("cards")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .take(100);
      for (const card of cards) {
        const transactions = await ctx.db
          .query("transactions")
          .withIndex("by_card", (q) => q.eq("cardId", card._id))
          .take(1000);
        for (const transaction of transactions) {
          await ctx.db.delete("transactions", transaction._id);
        }
        await ctx.db.delete("cards", card._id);
      }
      await ctx.db.delete("employees", employee._id);
    }

    const tunde = await ctx.db.insert("employees", {
      ownerId: args.ownerId,
      name: "Tunde Bakare",
      email: "tunde@acme.ng",
      department: "Engineering & DevOps",
      inviteStatus: "LINKED",
      bmoniInviteId: "inv_bmoni_reset_tunde",
      bmoniLinkedUserId: "bmoni_usr_link_501",
      inviteUrl: "https://bmoni.app/invite/inv_tunde",
    });

    const chioma = await ctx.db.insert("employees", {
      ownerId: args.ownerId,
      name: "Chioma Eze",
      email: "chioma@acme.ng",
      department: "Sales & Growth",
      inviteStatus: "LINKED",
      bmoniInviteId: "inv_bmoni_reset_chioma",
      bmoniLinkedUserId: "bmoni_usr_link_502",
      inviteUrl: "https://bmoni.app/invite/inv_chioma",
    });

    const emeka = await ctx.db.insert("employees", {
      ownerId: args.ownerId,
      name: "Emeka Obi",
      email: "emeka@acme.ng",
      department: "Field Operations",
      inviteStatus: "PENDING",
      bmoniInviteId: "inv_bmoni_reset_emeka",
      bmoniLinkedUserId: null,
      inviteUrl: "https://bmoni.app/invite/inv_emeka",
    });

    const fatima = await ctx.db.insert("employees", {
      ownerId: args.ownerId,
      name: "Fatima Danjuma",
      email: "fatima@acme.ng",
      department: "Finance & Admin",
      inviteStatus: "LINKED",
      bmoniInviteId: "inv_bmoni_reset_fatima",
      bmoniLinkedUserId: "bmoni_usr_link_504",
      inviteUrl: "https://bmoni.app/invite/inv_fatima",
    });

    const tundeCard = await ctx.db.insert("cards", {
      employeeId: tunde,
      employeeName: "Tunde Bakare",
      employeeEmail: "tunde@acme.ng",
      bmoniCardId: "bmoni_crd_reset_tunde",
      type: "VIRTUAL",
      currency: "NGN",
      limitAmount: 150000,
      spentAmount: 84200,
      status: "ACTIVE",
      maskedPan: "5399 •••• •••• 4821",
      expiryMonth: "08",
      expiryYear: "28",
      cvv: "624",
      lastUsedAt: iso(2 * 3600000),
    });

    const chiomaCard = await ctx.db.insert("cards", {
      employeeId: chioma,
      employeeName: "Chioma Eze",
      employeeEmail: "chioma@acme.ng",
      bmoniCardId: "bmoni_crd_reset_chioma",
      type: "VIRTUAL",
      currency: "NGN",
      limitAmount: 75000,
      spentAmount: 29500,
      status: "ACTIVE",
      maskedPan: "5399 •••• •••• 9104",
      expiryMonth: "09",
      expiryYear: "28",
      cvv: "811",
      lastUsedAt: iso(5 * 3600000),
    });

    const fatimaCard = await ctx.db.insert("cards", {
      employeeId: fatima,
      employeeName: "Fatima Danjuma",
      employeeEmail: "fatima@acme.ng",
      bmoniCardId: "bmoni_crd_reset_fatima",
      type: "VIRTUAL",
      currency: "NGN",
      limitAmount: 50000,
      spentAmount: 12000,
      status: "FROZEN",
      maskedPan: "5399 •••• •••• 3042",
      expiryMonth: "11",
      expiryYear: "28",
      cvv: "190",
      lastUsedAt: iso(24 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: tundeCard,
      employeeId: tunde,
      employeeName: "Tunde Bakare",
      bmoniTransactionId: "bmoni_tx_reset_001",
      amount: 45000,
      currency: "NGN",
      merchant: "AWS Cloud Services",
      category: "Cloud & Infrastructure",
      status: "SUCCESS",
      occurredAt: iso(2 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: tundeCard,
      employeeId: tunde,
      employeeName: "Tunde Bakare",
      bmoniTransactionId: "bmoni_tx_reset_002",
      amount: 14200,
      currency: "NGN",
      merchant: "Uber Nigeria Ride",
      category: "Travel & Mobility",
      status: "SUCCESS",
      occurredAt: iso(14 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: chiomaCard,
      employeeId: chioma,
      employeeName: "Chioma Eze",
      bmoniTransactionId: "bmoni_tx_reset_003",
      amount: 25000,
      currency: "NGN",
      merchant: "TotalEnergies Fuel Station VI",
      category: "Fuel & Transportation",
      status: "SUCCESS",
      occurredAt: iso(5 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: tundeCard,
      employeeId: tunde,
      employeeName: "Tunde Bakare",
      bmoniTransactionId: "bmoni_tx_reset_004",
      amount: 25000,
      currency: "NGN",
      merchant: "GitHub Enterprise Subscription",
      category: "Software & SaaS",
      status: "SUCCESS",
      occurredAt: iso(28 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: chiomaCard,
      employeeId: chioma,
      employeeName: "Chioma Eze",
      bmoniTransactionId: "bmoni_tx_reset_005",
      amount: 4500,
      currency: "NGN",
      merchant: "Chicken Republic Lekki",
      category: "Meals & Entertainment",
      status: "SUCCESS",
      occurredAt: iso(48 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: fatimaCard,
      employeeId: fatima,
      employeeName: "Fatima Danjuma",
      bmoniTransactionId: "bmoni_tx_reset_006",
      amount: 12000,
      currency: "NGN",
      merchant: "Office Supplies Hub Ikeja",
      category: "Office & Supplies",
      status: "SUCCESS",
      occurredAt: iso(24 * 3600000),
    });

    await ctx.db.insert("transactions", {
      cardId: fatimaCard,
      employeeId: fatima,
      employeeName: "Fatima Danjuma",
      bmoniTransactionId: "bmoni_tx_reset_007",
      amount: 85000,
      currency: "NGN",
      merchant: "Jumia Tech Store",
      category: "Equipment",
      status: "DECLINED",
      declinedReason: "Card is currently FROZEN by administrator",
      occurredAt: iso(8 * 3600000),
    });

    const walletId = owner.bmoniWalletId ?? `${args.ownerId}_wallet`;
    const wallet = await ctx.db
      .query("walletBalances")
      .withIndex("by_wallet_id", (q) => q.eq("walletId", walletId))
      .first();
    if (wallet) {
      await ctx.db.patch("walletBalances", wallet._id, { balance: 875000 });
    } else {
      await ctx.db.insert("walletBalances", { walletId, balance: 875000 });
    }
  },
});
