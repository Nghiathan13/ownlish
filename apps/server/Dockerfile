FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json

RUN pnpm install --frozen-lockfile --filter ownlish-server...

COPY apps/server ./apps/server

RUN pnpm --filter ownlish-server exec prisma generate
RUN pnpm --filter ownlish-server build

FROM base AS runner

ENV NODE_ENV="production"

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server ./apps/server

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
