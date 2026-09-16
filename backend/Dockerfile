# ---- Stage 1: build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .
RUN npm ci --omit=dev

COPY server.js .

# ---- Stage 2: runtime ----
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js .

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]