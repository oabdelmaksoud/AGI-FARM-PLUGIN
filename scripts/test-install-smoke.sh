#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="$(mktemp -d -t agi-farm-install-smoke-XXXXXX)"
PREFIX_DIR="$TEMP_DIR/prefix"
PACK_DIR="$TEMP_DIR/pack"
LOG_PREFIX="[install-smoke]"

cleanup() {
  echo "$LOG_PREFIX Temp assets kept at: $TEMP_DIR"
  echo "$LOG_PREFIX Remove when done: rm -rf '$TEMP_DIR'"
}
trap cleanup EXIT

echo "$LOG_PREFIX Verifying OpenClaw availability"
if ! openclaw --version >/dev/null 2>&1; then
  echo "$LOG_PREFIX ERROR: openclaw is not installed or not on PATH" >&2
  exit 1
fi

mkdir -p "$PREFIX_DIR" "$PACK_DIR"

echo "$LOG_PREFIX Packing plugin"
PACK_JSON="$(cd "$ROOT_DIR" && npm pack --json --pack-destination "$PACK_DIR")"
TARBALL_NAME="$(node -e "const d=JSON.parse(process.argv[1]); console.log(d[0].filename);" "$PACK_JSON")"
TARBALL_PATH="$PACK_DIR/$TARBALL_NAME"

if [[ ! -f "$TARBALL_PATH" ]]; then
  echo "$LOG_PREFIX ERROR: tarball not found: $TARBALL_PATH" >&2
  exit 1
fi

echo "$LOG_PREFIX Installing tarball globally into isolated prefix"
npm install -g --prefix "$PREFIX_DIR" "$TARBALL_PATH"

BIN_PATH="$PREFIX_DIR/bin"
export PATH="$BIN_PATH:$PATH"

echo "$LOG_PREFIX Verifying installed CLI"
agi-farm-status >/dev/null

EXTENSIONS_DIR="${HOME}/.openclaw/extensions"
EXISTING_PLUGIN_PATH="${EXTENSIONS_DIR}/agi-farm"

if [[ -L "$EXISTING_PLUGIN_PATH" || -d "$EXISTING_PLUGIN_PATH" ]]; then
  echo "$LOG_PREFIX Found existing agi-farm plugin install at $EXISTING_PLUGIN_PATH"
  echo "$LOG_PREFIX Removing existing install to avoid OpenClaw path safety conflicts"
  openclaw plugins uninstall agi-farm --force >/dev/null 2>&1 || true
  if [[ -L "$EXISTING_PLUGIN_PATH" || -d "$EXISTING_PLUGIN_PATH" ]]; then
    rm -rf "$EXISTING_PLUGIN_PATH"
  fi
fi

echo "$LOG_PREFIX Installing via OpenClaw plugin manager"
openclaw plugins install agi-farm

echo "$LOG_PREFIX Validating plugin appears in OpenClaw plugins list"
PLUGIN_LIST="$(openclaw plugins list 2>/dev/null || true)"
if ! printf '%s' "$PLUGIN_LIST" | grep -q "agi-farm"; then
  echo "$LOG_PREFIX ERROR: agi-farm not found in plugin list" >&2
  exit 1
fi

echo "$LOG_PREFIX PASS: install smoke checks completed"
