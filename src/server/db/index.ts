import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return (database ??= drizzle(url, { schema }));
}
