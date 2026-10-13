import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const webhookLogFields = {
  eventType: v.union(
    v.literal("kyc.activated"),
    v.literal("invite.linked"),
    v.literal("deposit.confirmed"),
    v.literal("card.transaction"),
  ),
  payload: v.any(),
  signature: v.string(),
  status: v.union(v.literal("PROCESSED"), v.literal("FAILED")),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("webhookLogs").order("desc").take(500);
  },
});

export const create = mutation({
  args: webhookLogFields,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("webhookLogs", args);
    return await ctx.db.get("webhookLogs", id);
  },
});
