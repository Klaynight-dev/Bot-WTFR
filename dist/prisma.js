"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaEnabled = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Initialize real Prisma client only when BDD_URL is provided.
// If missing, export a proxy that allows the app to start (useful for command deploys)
// while making DB calls fail with a clear message at the time of use.
const connectionString = process.env.BDD_URL?.trim();
let prisma;
if (connectionString) {
    const adapter = new adapter_pg_1.PrismaPg({ connectionString });
    prisma = new client_1.PrismaClient({ adapter });
}
else {
    const missingMsg = 'Environment variable BDD_URL is not set — Prisma is disabled.';
    // A proxy that returns async functions which reject with a helpful error when called.
    // Allow explicitly-set properties on the proxy target (for example $connect/$disconnect)
    // to be returned so lifecycle methods can be no-ops.
    const handler = {
        get: (target, prop) => {
            if (prop in target)
                return target[prop];
            return new Proxy(() => Promise.reject(new Error(missingMsg)), {
                apply: () => Promise.reject(new Error(missingMsg)),
                get: () => handler.get,
            });
        }
    };
    const noopPrisma = new Proxy({}, handler);
    // Provide no-op connect/disconnect so lifecycle calls won't fail.
    noopPrisma.$connect = async () => undefined;
    noopPrisma.$disconnect = async () => undefined;
    prisma = noopPrisma;
}
exports.prismaEnabled = Boolean(connectionString);
exports.default = prisma;
