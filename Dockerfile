FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev giflib-dev jpeg-dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts
COPY prisma.config.ts ./

RUN pnpm config set only-built-dependencies canvas prisma @prisma/engines \
    && pnpm install --no-frozen-lockfile

RUN npx prisma generate

RUN pnpm run build

RUN mkdir -p dist/dashboard/views && cp -r src/dashboard/views/* dist/dashboard/views/

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache \
    python3 make g++ \
    cairo-dev pango-dev giflib-dev jpeg-dev \
    cairo pango giflib jpeg

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm config set only-built-dependencies canvas prisma @prisma/engines \
    && pnpm install --no-frozen-lockfile --prod=false \
    && npx prisma generate \
    && pnpm prune --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY contents ./contents

USER node

CMD ["npm", "run", "start:docker"]

