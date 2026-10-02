#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PG_BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl || command -v postgres)")}"
PRIYM_DATA="$PWD/.data/postgres"
mkdir -p "$PRIYM_DATA" "$PWD/.data/socket"
if [ "${1:-start}" = stop ]; then "$PG_BIN/pg_ctl" -D "$PRIYM_DATA" -m fast stop; exit; fi
if [ ! -f "$PRIYM_DATA/PG_VERSION" ]; then
  "$PG_BIN/initdb" -D "$PRIYM_DATA" -U priym --auth-local=trust --auth-host=scram-sha-256 --pwfile=<(printf '%s\n' priym) >/dev/null
fi
if ! "$PG_BIN/pg_ctl" -D "$PRIYM_DATA" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$PRIYM_DATA" -l "$PWD/.data/postgres.log" -o "-h 127.0.0.1 -p 54329 -k $PWD/.data/socket" -w start
fi
if ! PGPASSWORD=priym "$PG_BIN/psql" -h 127.0.0.1 -p 54329 -U priym -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='priym'" | rg -q 1; then
  PGPASSWORD=priym "$PG_BIN/createdb" -h 127.0.0.1 -p 54329 -U priym priym
fi
