#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/operation-content-platform"
APP_NAME="operation-content-platform"

cd "$APP_DIR"

source /root/.nvm/nvm.sh
nvm use 20

git fetch origin main
git reset --hard origin/main

npm ci
npm run build

pm2 restart "$APP_NAME" --update-env -- start -- -p 3000 -H 127.0.0.1
pm2 save
