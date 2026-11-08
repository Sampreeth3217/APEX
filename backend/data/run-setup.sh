#!/bin/sh
cd /app/backend
set -a; . ./.env; set +a
node scripts/demo.js > data/demo.log 2>&1
echo DONE >> data/demo.log
