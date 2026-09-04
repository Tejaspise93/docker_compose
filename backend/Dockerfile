# ---- Stage 1: build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY server.js .

# ---- Stage 2: runtime ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js .

EXPOSE 3000

CMD ["npm", "start"]