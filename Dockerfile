FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

RUN pnpm install --no-frozen-lockfile --ignore-scripts

RUN if [ -z "$BDD_URL" ]; then \
			echo "Skipping prisma generate (no BDD_URL provided)"; \
		else \
			DATABASE_URL="$BDD_URL" pnpm prisma:generate; \
		fi
RUN pnpm run build

FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

USER node

CMD ["node", "dist/index.js"]
