"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.BDD_URL?.trim();
let prisma;
if (connectionString) {
    const adapter = new adapter_pg_1.PrismaPg({ connectionString });
    prisma = new client_1.PrismaClient({ adapter });
}
else {
    const missingMsg = 'Environment variable BDD_URL is not set — Prisma is disabled.';
    const handler = {
        get: () => {
            return new Proxy(() => Promise.reject(new Error(missingMsg)), {
                apply: () => Promise.reject(new Error(missingMsg)),
                get: () => handler.get,
            });
        }
    };
    const noopPrisma = new Proxy({}, handler);
    noopPrisma.$connect = async () => undefined;
    noopPrisma.$disconnect = async () => undefined;
    prisma = noopPrisma;
}
exports.default = prisma;
