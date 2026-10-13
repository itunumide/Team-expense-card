/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cards from "../cards.js";
import type * as dashboard from "../dashboard.js";
import type * as demo from "../demo.js";
import type * as employees from "../employees.js";
import type * as owners from "../owners.js";
import type * as transactions from "../transactions.js";
import type * as wallets from "../wallets.js";
import type * as webhookLogs from "../webhookLogs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cards: typeof cards;
  dashboard: typeof dashboard;
  demo: typeof demo;
  employees: typeof employees;
  owners: typeof owners;
  transactions: typeof transactions;
  wallets: typeof wallets;
  webhookLogs: typeof webhookLogs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
