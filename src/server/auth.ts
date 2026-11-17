import "server-only";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { getDb } from "./db";
import { user, session, account, verification, rateLimit } from "./db/schema";
let instance: ReturnType<typeof betterAuth> | undefined;
export function authReady() {
  return !!(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL
  );
}
export function getAuth() {
  if (!authReady()) throw new Error("AUTH_NOT_CONFIGURED");
  return (instance ??= betterAuth<BetterAuthOptions>({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification, rateLimit },
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
  }));
}
export async function currentUser() {
  if (!authReady()) return null;
  return (
    (await getAuth().api.getSession({ headers: await headers() }))?.user || null
  );
}
