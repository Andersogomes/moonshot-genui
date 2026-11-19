#!/bin/sh
# Edge Functions only bundle files under their own folder: copy the shared core in.
set -e
cd "$(dirname "$0")/.."
rm -rf supabase/functions/generate-screen/core
mkdir -p supabase/functions/generate-screen/core
for f in packages/genui-core/src/*.ts; do case "$f" in *.test.ts) ;; *) cp "$f" supabase/functions/generate-screen/core/ ;; esac; done
echo "synced $(ls supabase/functions/generate-screen/core | wc -l | tr -d ' ') core files"
