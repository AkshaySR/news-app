FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY apps/web ./apps/web
RUN npm ci && cd apps/web && npm run build

FROM nginx:alpine AS runner
WORKDIR /app

# Copy built app to nginx
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]