import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma v7 requires a Prisma config file for CLI commands (db push / migrate / studio).
// This file provides the datasource URL (reads from BDD_URL in .env).

export default defineConfig({
  datasource: {
    // Use env helper so the CLI can validate the value at load time
    url: env("BDD_URL"),
  },
});
