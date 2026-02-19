# multi-stage Dockerfile for WTFR Discord bot
# - builder: installs dev deps, builds TypeScript to /app/dist
# - runner: installs only production deps and runs the compiled app

FROM node:20-alpine AS builder

# enable corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# copy lockfile and package.json first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml tsconfig.json ./

# copy source and build
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm run build

# ----- final image -----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

# install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# copy compiled output
COPY --from=builder /app/dist ./dist

# run as non-root (node user exists in official node images)
USER node

CMD ["node", "dist/index.js"]
