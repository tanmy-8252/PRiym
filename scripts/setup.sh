#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
node scripts/create-env.mjs
case "${1:-embedded}" in
  embedded) node scripts/embedded-db.mjs start ;;
  docker|native)
    node --input-type=module -e 'import fs from "node:fs"; let s=fs.readFileSync(".env","utf8").replace(/DATABASE_URL="postgresql:\/\/postgres:postgres@127.0.0.1:54329\/postgres"/,"DATABASE_URL=\"postgresql://priym:priym@127.0.0.1:54329/priym\"").replace(/PG_POOL_MAX="1"/,"PG_POOL_MAX=\"10\""); fs.writeFileSync(".env",s);'
    if [ "$1" = docker ]; then docker compose up -d --wait db; else bash scripts/local-db.sh start; fi
    ;;
  existing) ;;
  *) printf 'Choose embedded, docker, native or existing.\n'; exit 1 ;;
esac
npm run db:generate
npm run db:deploy
npm run db:seed
printf '\nReady. Run npm run dev and open http://127.0.0.1:3000\n'
