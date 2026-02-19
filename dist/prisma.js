"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.BDD_URL;
if (!connectionString || connectionString.trim().length === 0) {
    throw new Error('Environment variable BDD_URL is required to initialize Prisma (Prisma v7 adapter).');
}
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
