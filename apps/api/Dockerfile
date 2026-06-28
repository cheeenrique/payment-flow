# build context = repo root (npm workspaces)
FROM node:20-alpine

WORKDIR /app

# manifests first for layer cache
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/api apps/api

RUN npm run build --workspace @payment-flow/api

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
