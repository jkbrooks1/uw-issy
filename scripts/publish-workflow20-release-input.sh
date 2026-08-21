#!/usr/bin/env sh
set -eu

SOURCE_JSON="${1:-/files/uw-issy-connectors/public/workflow20-status-latest.json}"
WORKDIR="${2:-/files/uw-issy-connectors/github/uw-issy-release-bridge}"
REPO_SSH="${3:-git@github.com:jkbrooks1/uw-issy.git}"
BRANCH="${4:-main}"
DEST_REL="data/connectors/evidence/workflow20-status-latest.json"
KEY_PATH="${UWISSY_GITHUB_DEPLOY_KEY:-/files/uw-issy-connectors/secrets/github_deploy_key_ed25519}"

if [ ! -f "$SOURCE_JSON" ]; then
  echo "FAIL: source JSON not found: $SOURCE_JSON" >&2
  exit 1
fi
if [ ! -f "$KEY_PATH" ]; then
  echo "FAIL: deploy key not found: $KEY_PATH" >&2
  exit 1
fi

node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$SOURCE_JSON"

export GIT_SSH_COMMAND="ssh -i $KEY_PATH -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
mkdir -p "$(dirname "$WORKDIR")"

if [ ! -d "$WORKDIR/.git" ]; then
  rm -rf "$WORKDIR"
  git clone --branch "$BRANCH" "$REPO_SSH" "$WORKDIR"
fi

cd "$WORKDIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fdx

mkdir -p "$(dirname "$DEST_REL")"
cp "$SOURCE_JSON" "$DEST_REL"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$DEST_REL"

git config user.name "uwissy-lane20-release-bridge"
git config user.email "uwissy-lane20-release-bridge@users.noreply.github.com"

if [ -z "$(git status --porcelain -- "$DEST_REL")" ]; then
  echo "NOOP: release input already matches $SOURCE_JSON"
  git rev-parse HEAD
  exit 0
fi

git add "$DEST_REL"
git diff --cached --name-only
git commit -m "Update UWISSY Lane 20 release input"
git push origin "$BRANCH"
git rev-parse HEAD
