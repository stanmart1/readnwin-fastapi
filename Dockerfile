# ----------------------
# Builder stage
# ----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ----------------------
# Runner stage
# ----------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone server to root
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy server files for app directory
COPY --from=builder /app/.next/server ./.next/server

# Copy public assets
COPY --from=builder /app/public ./public
# Dummy healthcheck that always returns success
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

EXPOSE 3000

# Run Next.js standalone server
CMD ["node", "server.js"]
