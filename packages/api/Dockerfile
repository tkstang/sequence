# syntax=docker/dockerfile:1.7

FROM node:24.5.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/package.json
COPY packages/game-logic/package.json packages/game-logic/package.json

RUN pnpm install --frozen-lockfile --filter @sequence/api... --ignore-scripts

FROM deps AS runtime

ENV NODE_ENV="production"
ENV PORT="3001"

COPY tsconfig.base.json ./
COPY packages/api packages/api
COPY packages/game-logic packages/game-logic

EXPOSE 3001

CMD ["pnpm", "--filter", "@sequence/api", "start"]
