#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVE="${1:-}"
SERVER_PORT="${PORT:-4000}"
CLIENT_PORT=5173

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti tcp:"${port}" || true)
  if [[ -n "${pids}" ]]; then
    echo "[setup] freeing port ${port} (pids: ${pids})"
    kill -9 ${pids} 2>/dev/null || true
  fi
}

run_step() {
  local label="$1"
  local dir="$2"
  local cmd="$3"
  echo "[setup] ${label}..."
  (cd "${ROOT_DIR}/${dir}" && eval "${cmd}")
}

run_step "server deps" "server" "npm install"
run_step "client deps" "client" "npm install"
run_step "electron deps" "electron" "npm install"

run_step "server tests" "server" "npm test"
run_step "server build" "server" "npm run build"
run_step "client build" "client" "npm run build"
run_step "electron build" "electron" "npm run build --if-present"

if [[ "${SERVE}" == "--serve" ]]; then
  kill_port "${SERVER_PORT}"
  kill_port "${CLIENT_PORT}"
  kill_port $((CLIENT_PORT + 1))
  kill_port $((CLIENT_PORT + 2))

  echo "[setup] starting server and client preview..."
  (cd "${ROOT_DIR}/server" && npm run start & echo $! > "${ROOT_DIR}/deployment/.server.pid")
  (cd "${ROOT_DIR}/client" && npm run preview -- --host 0.0.0.0 --port 5173 & echo $! > "${ROOT_DIR}/deployment/.client.pid")
  SERVER_PID=$(cat "${ROOT_DIR}/deployment/.server.pid")
  CLIENT_PID=$(cat "${ROOT_DIR}/deployment/.client.pid")
  echo "[setup] server pid: ${SERVER_PID}, client pid: ${CLIENT_PID}"
  trap 'echo "[setup] stopping..."; kill ${SERVER_PID} ${CLIENT_PID} 2>/dev/null || true' EXIT INT TERM
  echo "[setup] running. Press Ctrl+C to stop."
  wait ${SERVER_PID} ${CLIENT_PID}
fi

echo "[setup] done."
