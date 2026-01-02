# ============================================
# STAGE 1: DEPENDENCIES (Cached Layer)
# ============================================
ARG SERVICE_NAME

FROM node:24-alpine AS deps
ARG SERVICE_NAME

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

# ============================================
# STAGE 2: BUILDER
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma
COPY ./prisma.config.ts ./

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

RUN npx tsc -p tsconfig.json

RUN npm prune --omit=dev && rm -rf /app/node_modules/.cache 

# ============================================
# STAGE 3: PRODUCTION (Minimal Image)
# ============================================
FROM node:24-alpine AS production
ARG SERVICE_NAME

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY --from=builder /app/dist/generated/prisma ./dist/generated/prisma

USER nodejs

EXPOSE 8080

CMD ["node", "dist/index.js"]


# deploy to cloud run  europe-west3-docker.pkg.dev/gen-lang-client-0712833925/supaprojectregistry  docker buildx build -t backend:latest . --no-cache

# docker buildx build --platform linux/amd64 -t europe-west3-docker.pkg.dev/gen-lang-client-0712833925/supaprojectregistry/backend:latest --no-cache --push .
