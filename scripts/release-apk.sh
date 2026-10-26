#!/usr/bin/env bash
# Builds the preview APK and publishes it as a GitHub release of andrextor/beekeeper-releases.
# Usage: pnpm release:apk [--cloud]   (default: local build, no EAS cloud quota)
set -euo pipefail

repo='andrextor/beekeeper-releases'
stable="https://github.com/$repo/releases/latest/download/landak-apiario.apk"
cd "$(dirname "$0")/.."

mode='local'
if [[ "${1:-}" == '--cloud' ]]; then mode='cloud'; fi

version=$(node -p "require('./app.json').expo.version")
version_code=$(node -p "require('./app.json').expo.android.versionCode")
tag="v$version"

[[ "$(git branch --show-current)" == 'main' ]] || { echo 'Release from main only.'; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo 'Commit or stash your changes first.'; exit 1; }
! grep -q 'PASTE_' eas.json || { echo 'eas.json still has a placeholder Supabase key.'; exit 1; }
command -v gh >/dev/null || { echo 'Install gh: brew install gh && gh auth login'; exit 1; }
! gh release view "$tag" --repo "$repo" >/dev/null 2>&1 || { echo "$tag is already published."; exit 1; }

rm -rf dist && mkdir dist
if [[ "$mode" == 'local' ]]; then
  npx eas-cli@latest build --local -p android --profile preview --non-interactive \
    --output dist/landak-apiario.apk
else
  url=$(npx eas-cli@latest build -p android --profile preview --non-interactive --wait --json |
    node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s)[0].artifacts.buildUrl))")
  curl -fL "$url" -o dist/landak-apiario.apk
fi

# The CHANGELOG section of this version becomes the release notes.
awk -v v="## [$version]" 'index($0, v) == 1 { on = 1; next } /^## \[/ { on = 0 } on' CHANGELOG.md \
  > dist/notes.md
[[ -s dist/notes.md ]] || { echo "CHANGELOG.md has no ## [$version] section."; exit 1; }

node -e "
const fs = require('fs')
fs.writeFileSync('dist/latest.json', JSON.stringify({
  version: '$version',
  versionCode: $version_code,
  apkUrl: '$stable',
  notes: fs.readFileSync('dist/notes.md', 'utf8').trim(),
  publishedAt: new Date().toISOString(),
}, null, 2) + '\n')
"

gh release create "$tag" dist/landak-apiario.apk dist/latest.json --repo "$repo" \
  --title "Landak Apiario $version" --notes-file dist/notes.md
echo "Published $tag. Share: $stable"
