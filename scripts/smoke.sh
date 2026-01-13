#!/usr/bin/env bash
set -euo pipefail

# Simple smoke-check script for Lehlehka backend.
# Works in Git Bash / WSL / Linux.

BASE_URL="${BASE_URL:-http://localhost:4000}"
EMAIL="${EMAIL:-owner@example.com}"
PASSWORD="${PASSWORD:-secret123}"

echo "[smoke] BASE_URL=$BASE_URL"

echo "[smoke] health"
curl -fsS "$BASE_URL/health" >/dev/null

echo "[smoke] register (ignore if already exists)"
curl -sS -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Owner\"}" >/dev/null || true

echo "[smoke] login"
LOGIN_JSON="$(curl -fsS -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

ACCESS="$(echo "$LOGIN_JSON" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')"

if [[ -z "$ACCESS" ]]; then
  echo "[smoke] ERROR: failed to parse accessToken" >&2
  echo "$LOGIN_JSON" >&2
  exit 1
fi

echo "[smoke] create task"
TODAY="$(date +%F)"
TASK_JSON="$(curl -fsS -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke task\",\"date\":\"$TODAY\"}")"

TASK_ID="$(echo "$TASK_JSON" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
if [[ -z "$TASK_ID" ]]; then
  echo "[smoke] ERROR: failed to parse task id" >&2
  echo "$TASK_JSON" >&2
  exit 1
fi

echo "[smoke] get tasks by date"
curl -fsS "$BASE_URL/api/tasks?date=$TODAY" \
  -H "Authorization: Bearer $ACCESS" >/dev/null

echo "[smoke] mark task done"
curl -fsS -X PATCH "$BASE_URL/api/tasks/$TASK_ID/status" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"isDone":true}' >/dev/null

echo "[smoke] public week dashboard"
curl -fsS "$BASE_URL/api/weeks/10" >/dev/null

echo "[smoke] docs openapi.yaml"
curl -fsS "$BASE_URL/docs/openapi.yaml" >/dev/null

echo "[smoke] OK"
