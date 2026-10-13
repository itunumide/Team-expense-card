import { ConvexHttpClient } from "convex/browser";

const url = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;

if (!url) {
  throw new Error(
    "Missing CONVEX_URL (or VITE_CONVEX_URL) in environment. " +
      "Run `npx convex dev` to create a deployment and add the URL to your environment."
  );
}

export const convexClient = new ConvexHttpClient(url);
