# build context = repo root (npm workspaces)
FROM node:20-alpine

WORKDIR /app

# manifests first for layer cache
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/web apps/web

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
