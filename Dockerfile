FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json* ./
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY apps ./apps
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules from builder
COPY --from=builder /app/apps/mcp-server/dist ./apps/mcp-server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/mcp-server/package.json ./apps/mcp-server/package.json

WORKDIR /app/apps/mcp-server
EXPOSE 8080
CMD ["node","dist/index.js"]
