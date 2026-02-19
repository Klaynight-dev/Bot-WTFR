import "dotenv/config";
import { defineConfig, env } from "prisma/config";


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
