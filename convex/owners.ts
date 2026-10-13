import { mutation, query } from "./_generated/server";
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

const ownerFields = {
  name: v.string(),
  email: v.string(),
  companyName: v.string(),
  bmoniUserId: v.union(v.string(), v.null()),
  bmoniWalletId: v.union(v.string(), v.null()),
  kycStatus,
  kycDetails: v.optional(kycDetails),
  virtualAccount: v.union(virtualAccount, v.null()),
};

const ownerPatch = {
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  companyName: v.optional(v.string()),
  bmoniUserId: v.optional(v.union(v.string(), v.null())),
  bmoniWalletId: v.optional(v.union(v.string(), v.null())),
  kycStatus: v.optional(kycStatus),
  kycDetails: v.optional(kycDetails),
  virtualAccount: v.optional(v.union(virtualAccount, v.null())),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("owners").take(1000);
  },
});

export const getById = query({
  args: { id: v.id("owners") },
  handler: async (ctx, args) => {
    return await ctx.db.get("owners", args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("owners")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByBmoniUserId = query({
  args: { bmoniUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("owners")
      .withIndex("by_bmoni_user_id", (q) => q.eq("bmoniUserId", args.bmoniUserId))
      .first();
  },
});

export const create = mutation({
  args: ownerFields,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("owners", args);
    return await ctx.db.get("owners", id);
  },
});

export const update = mutation({
  args: {
    id: v.id("owners"),
    patch: v.object(ownerPatch),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("owners", args.id);
    if (!existing) return null;
    await ctx.db.patch("owners", args.id, args.patch);
    return await ctx.db.get("owners", args.id);
  },
});
