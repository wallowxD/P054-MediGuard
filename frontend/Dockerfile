# Build context = ./frontend (khác backend/Dockerfile — cái đó dùng repo root).
#   docker build -t medsafe-web ./frontend
# Xem docker-compose.yml: context: ./frontend

# Yarn 4 lấy qua corepack, đúng bản pin ở trường "packageManager" trong package.json.
# Tắt prompt xác nhận tải vì build không có TTY.

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps

# sharp (next/image) cần glibc shim trên Alpine
RUN apk add --no-cache libc6-compat

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Cài deps trước, tách khỏi source để tận dụng layer cache
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ---- Stage 2: Build ----
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ★ Biến NEXT_PUBLIC_* được NHÚNG THẲNG vào bundle lúc build, không đọc lúc chạy.
#   Nên phải truyền dạng build arg, đặt ở `environment:` của compose là vô tác dụng.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# ---- Stage 3: Runtime ----
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Security: chạy bằng user thường
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# output: "standalone" sinh ra server.js + node_modules tối giản trong .next/standalone.
# static/ và public/ nằm ngoài gói đó nên phải copy riêng.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Dùng 127.0.0.1 chứ KHÔNG dùng localhost: trong container localhost resolve ra
# IPv6 [::1], còn Next bind theo HOSTNAME=0.0.0.0 nên chỉ nghe IPv4 → connection refused.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
