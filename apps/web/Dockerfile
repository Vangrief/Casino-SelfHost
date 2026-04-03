FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# Install deps
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# Build shared
FROM deps AS build-shared
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @casino/shared build

# Build web
FROM build-shared AS build
COPY apps/web/ apps/web/
RUN pnpm --filter @casino/web build

# Serve with nginx
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
