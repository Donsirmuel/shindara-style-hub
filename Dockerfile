# Single-image per client: builds Vite storefront + runs Fastify + PGlite
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/data ./src/data
RUN mkdir -p /app/data/pgdata /app/uploads
VOLUME ["/app/data", "/app/uploads"]
EXPOSE 3000
CMD ["node", "--import", "tsx/esm", "server/index.ts"]
