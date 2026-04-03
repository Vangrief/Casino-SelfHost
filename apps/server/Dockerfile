FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# Install deps
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# Build shared
FROM deps AS build-shared
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @casino/shared build

# Build server
FROM build-shared AS build
COPY apps/server/ apps/server/
RUN pnpm --filter @casino/server build

# Production
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=deps /app/package.json ./
COPY --from=deps /app/apps/server/package.json ./apps/server/
COPY --from=deps /app/packages/shared/package.json ./packages/shared/
COPY --from=deps /app/pnpm-workspace.yaml ./

# Migrations
COPY apps/server/src/db/migrations ./apps/server/src/db/migrations

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
