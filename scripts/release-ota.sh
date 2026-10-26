#!/usr/bin/env bash
# Publishes a JS-only fix to the preview channel with the D1 values from eas.json, never the
# local .env (build-profile env does not reach `eas update`).
# Usage: pnpm release:ota "1.0.1: qué arregla"
set -euo pipefail
cd "$(dirname "$0")/.."

message="${1:?Usage: pnpm release:ota \"x.y.z: qué arregla\"}"
[[ "$(git branch --show-current)" == 'main' ]] || { echo 'Publish from main only.'; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo 'Commit or stash your changes first.'; exit 1; }
! grep -q 'PASTE_' eas.json || { echo 'eas.json still has a placeholder Supabase key.'; exit 1; }

EXPO_PUBLIC_SUPABASE_URL=$(node -p "require('./eas.json').build.preview.env.EXPO_PUBLIC_SUPABASE_URL") \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$(node -p "require('./eas.json').build.preview.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY") \
  npx eas-cli@latest update --channel preview --message "$message" --non-interactive
