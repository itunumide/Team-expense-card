import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const inviteStatus = v.union(
  v.literal("PENDING"),
  v.literal("LINKED"),
  v.literal("EXPIRED"),
);

const employeeFields = {
  ownerId: v.id("owners"),
  name: v.string(),
  email: v.string(),
  department: v.string(),
  inviteStatus,
  bmoniInviteId: v.string(),
  bmoniLinkedUserId: v.union(v.string(), v.null()),
  inviteUrl: v.string(),
  qrCodeDataUrl: v.optional(v.string()),
};

const employeePatch = {
  ownerId: v.optional(v.id("owners")),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  department: v.optional(v.string()),
  inviteStatus: v.optional(inviteStatus),
  bmoniInviteId: v.optional(v.string()),
  bmoniLinkedUserId: v.optional(v.union(v.string(), v.null())),
  inviteUrl: v.optional(v.string()),
  qrCodeDataUrl: v.optional(v.string()),
};

async function withCard(ctx: QueryCtx, employee: Doc<"employees">) {
  const card = await ctx.db
    .query("cards")
    .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
    .first();
  return { employee, card };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db.query("employees").take(1000);
    return await Promise.all(employees.map((employee) => withCard(ctx, employee)));
  },
});

export const listByOwner = query({
  args: { ownerId: v.id("owners") },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .take(1000);
    return await Promise.all(employees.map((employee) => withCard(ctx, employee)));
  },
});

export const getById = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get("employees", args.id);
    if (!employee) return null;
    return await withCard(ctx, employee);
  },
});

export const getByInviteId = query({
  args: { inviteId: v.string() },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_bmoni_invite_id", (q) => q.eq("bmoniInviteId", args.inviteId))
      .first();
    if (!employee) return null;
    return await withCard(ctx, employee);
  },
});

export const create = mutation({
  args: employeeFields,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("employees", args);
    return await ctx.db.get("employees", id);
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    patch: v.object(employeePatch),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("employees", args.id);
    if (!existing) return null;
    await ctx.db.patch("employees", args.id, args.patch);
    return await ctx.db.get("employees", args.id);
  },
});
