### Stage 1: build client ###
FROM node:20-alpine AS client-builder

WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

### Stage 2: server ###
FROM node:20-alpine

WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY --from=client-builder /client/dist ./public

EXPOSE 3001
CMD ["node", "app.js"]
