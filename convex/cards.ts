import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const cardStatus = v.union(
  v.literal("ACTIVE"),
  v.literal("FROZEN"),
  v.literal("TERMINATED"),
);

const cardFields = {
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
};

const cardPatch = {
  employeeId: v.optional(v.id("employees")),
  employeeName: v.optional(v.string()),
  employeeEmail: v.optional(v.string()),
  bmoniCardId: v.optional(v.string()),
  type: v.optional(v.literal("VIRTUAL")),
  currency: v.optional(v.literal("NGN")),
  limitAmount: v.optional(v.number()),
  spentAmount: v.optional(v.number()),
  status: v.optional(cardStatus),
  maskedPan: v.optional(v.string()),
  expiryMonth: v.optional(v.string()),
  expiryYear: v.optional(v.string()),
  cvv: v.optional(v.string()),
  lastUsedAt: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cards").take(1000);
  },
});

export const listByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .take(100);
  },
});

export const getById = query({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    return await ctx.db.get("cards", args.id);
  },
});

export const getByBmoniId = query({
  args: { bmoniCardId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_bmoni_card_id", (q) => q.eq("bmoniCardId", args.bmoniCardId))
      .first();
  },
});

export const create = mutation({
  args: cardFields,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("cards", args);
    return await ctx.db.get("cards", id);
  },
});

export const update = mutation({
  args: {
    id: v.id("cards"),
    patch: v.object(cardPatch),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("cards", args.id);
    if (!existing) return null;
    await ctx.db.patch("cards", args.id, args.patch);
    return await ctx.db.get("cards", args.id);
  },
});
