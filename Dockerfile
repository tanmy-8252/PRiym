FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
# ClamAV must have current signatures; mount /var/lib/clamav from your update service.
RUN apt-get update && apt-get install -y --no-install-recommends clamav ca-certificates && rm -rf /var/lib/apt/lists/* && useradd -m -u 1001 priym
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .data/uploads .data/scan && chown -R priym:priym /app
ENV CLAMSCAN_PATH=/usr/bin/clamscan
USER priym
EXPOSE 3000
CMD ["node", "server.js"]
