# syntax=docker/dockerfile:1
# Multi-stage build for Athlo API (NestJS) within the Turborepo monorepo

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --include=dev --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json package-lock.json* turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace=@athlo/shared
RUN npm run build --workspace=api

FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/packages/shared/package.json ./packages/shared/package.json

WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["node", "dist/main"]
