#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# scripts/test.sh — Full test lifecycle with Docker test database
#
# Usage:
#   ./scripts/test.sh              # run all tests
#   ./scripts/test.sh --coverage   # run with coverage
#   ./scripts/test.sh <jest args>  # pass any Jest arguments
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.test.yml"
ENV_TEST_FILE="$BACKEND_DIR/.env.test"

# ── Helpers ──────────────────────────────────────────
cleanup() {
  echo ""
  echo "🧹 Stopping test database..."
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
}

wait_for_db() {
  local retries=30
  local count=0
  echo "⏳ Waiting for test database to be ready..."
  until docker compose -f "$COMPOSE_FILE" exec -T test-db pg_isready -U test_user -d lms_db_test > /dev/null 2>&1; do
    count=$((count + 1))
    if [ "$count" -ge "$retries" ]; then
      echo "❌ Test database did not become ready in time."
      cleanup
      exit 1
    fi
    sleep 1
  done
  echo "✅ Test database is ready."
}

run_migrations() {
  if [ ! -f "$ENV_TEST_FILE" ]; then
    echo "❌ Missing .env.test at: $ENV_TEST_FILE"
    exit 1
  fi

  echo "🔄 Running Prisma migrations on test database..."
  set -a
  # Load test env so Prisma targets test DATABASE_URL
  # shellcheck disable=SC1090
  . "$ENV_TEST_FILE"
  set +a

  cd "$BACKEND_DIR"
  npx prisma migrate deploy
  echo "✅ Prisma migrations applied."
}

# ── Main ─────────────────────────────────────────────
trap cleanup EXIT

echo "🐳 Starting test database..."
docker compose -f "$COMPOSE_FILE" up -d --wait 2>/dev/null || docker compose -f "$COMPOSE_FILE" up -d

wait_for_db

run_migrations

echo "🧪 Running tests..."
cd "$BACKEND_DIR"
NODE_OPTIONS='--experimental-vm-modules' npx jest "$@"
