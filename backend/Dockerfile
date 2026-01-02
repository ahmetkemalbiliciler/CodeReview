# ============================================
# STAGE 1: DEPENDENCIES (Cached Layer)
# ============================================
ARG SERVICE_NAME

FROM node:24-alpine AS deps
ARG SERVICE_NAME

WORKDIR /app


# Servise özel package.json dosyalarını kopyalar.
COPY package.json package-lock.json ./

# Tüm bağımlılıkları yükler (build için devDependencies de dahildir).
RUN npm install

# ============================================
# STAGE 2: BUILDER
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Deps stage'den node_modules ve package.json dosyalarını alır (Önbellek için).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Servis kaynak kodunu, tsconfig ve Prisma şemasını kopyalar.
COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma
COPY .env ./prisma.config.ts ./

# Prisma Client'ı oluşturur. Bu, Query Engine'i dist/generated/prisma içine yerleştirir.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# TypeScript kodunu derler ve çıktıları /dist klasörüne yazar.
RUN npx tsc -p tsconfig.json

# Yalnızca production bağımlılıklarını tutmak için devDependencies'i siler.
# Generated Prisma Client dosyaları (.prisma klasörü) prod bağımlılığı sayıldığı için silinmez.
RUN npm prune --omit=dev && rm -rf /app/node_modules/.cache 

# ============================================
# STAGE 3: PRODUCTION (Minimal Image)
# ============================================
FROM node:24-alpine AS production
ARG SERVICE_NAME

# Güvenlik için non-root 'nodejs' kullanıcısı oluşturur.
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Sadece gerekli dosyaları kopyala:

# 1. Production bağımlılıkları (Pruned node_modules klasörü)
COPY --from=builder /app/node_modules ./node_modules

# 2. Derlenmiş JavaScript kodu
COPY --from=builder /app/dist ./dist

# 3. CRITICAL: Prisma Schema dosyası. Uygulama ve Migration için gereklidir.
COPY --from=builder /app/prisma ./prisma

# 4. CRITICAL: Prisma Config dosyası. Prisma CLI root dizinde arar.
# Bu dosya /app/prisma.config.js olarak kopyalanmalı (dist içinde değil).
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# 5. CRITICAL: Generated Prisma Client/Query Engine dosyaları. 
# Bu, uygulamanın DB'ye sorgu atmasını sağlayan native bileşendir.
COPY --from=builder /app/dist/generated/prisma ./dist/generated/prisma

USER nodejs

EXPOSE 8080

CMD ["node", "dist/index.js"]


# deploy to cloud run  europe-west3-docker.pkg.dev/gen-lang-client-0712833925/supaprojectregistry  docker buildx build -t backend:latest . --no-cache
