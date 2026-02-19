import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma v7 requires a Prisma config file for CLI commands (db push / migrate / studio).
// Make `BDD_URL` optional so build environments that don't supply the DB URL
// (for example during docker build) won't fail when running `prisma generate`.

let dbUrl: string | undefined;
try {
  dbUrl = env("BDD_URL");
} catch (err) {
  // env() throws when the variable is missing — tolerate that and continue.
  dbUrl = undefined;
}

export default defineConfig({
  datasource: dbUrl ? { url: dbUrl } : {},
});
