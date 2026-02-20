FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev giflib-dev jpeg-dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY scripts ./scripts
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

RUN pnpm install --no-frozen-lockfile --ignore-scripts

ARG BDD_URL
RUN if [ -z "$BDD_URL" ]; then \
			echo "Skipping prisma generate (no BDD_URL provided)"; \
		else \
			DATABASE_URL="$BDD_URL" pnpm prisma:generate; \
		fi
RUN pnpm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache cairo pango giflib jpeg

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# We need scripts in runner too for "clean-commands"
COPY --from=builder /app/scripts ./scripts

USER node

# Use "npm run go" to clean commands before starting
CMD ["npm", "run", "go"]

