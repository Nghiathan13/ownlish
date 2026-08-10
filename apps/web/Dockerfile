FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile --filter ownlish-web...

COPY apps/web ./apps/web

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_TOEIC_CATALOG_ROOT
ARG NEXT_PUBLIC_DICTATION_CATALOG_ROOT
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_TOEIC_CATALOG_ROOT=$NEXT_PUBLIC_TOEIC_CATALOG_ROOT
ENV NEXT_PUBLIC_DICTATION_CATALOG_ROOT=$NEXT_PUBLIC_DICTATION_CATALOG_ROOT
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN pnpm --filter ownlish-web build

FROM base AS runner

ENV NODE_ENV="production"
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web ./apps/web

WORKDIR /app

EXPOSE 3000

CMD ["pnpm", "--filter", "ownlish-web", "start"]
