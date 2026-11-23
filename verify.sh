#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
checkout() {
    git init -q "$work/$1"
    git -C "$work/$1" fetch -q --depth=1 "https://github.com/zotero/$1.git" "$2"
    git -C "$work/$1" checkout -q --detach FETCH_HEAD
}
checkout translators 14ab2b615f70c3d6bbfae4e84e6f50d88c640e6a
checkout utilities 0cb70fd48b6849cf23ddab866b5c2bd315bc274a
checkout zotero-schema b86c79b56479cadac3288e1f122cf34ef04e8809
export TRANSLATOR="$work/translators/CSL JSON.js"
export UTILITIES="$work/utilities" UTILITIES_SCHEMA_PATH="$work/zotero-schema/schema.json"
npm ci --prefix "$UTILITIES" --silent
if [ "${1:-}" != "--baseline" ]; then
    git -C "$work/translators" apply "$PWD/software.patch"
fi
node --test detect.test.mjs
