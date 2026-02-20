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

RUN npx prisma generate

RUN pnpm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache cairo pango giflib jpeg

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

USER node

CMD ["npm", "run", "start:docker"]

