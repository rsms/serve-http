#!/bin/sh
set -e
cd "$(dirname "$0")"
export PATH=$PWD/node_modules/.bin:$PATH
mkdir -p build

SRCFILE=node_modules/livereload-js/dist/livereload.js
TMPFILE=build/livereload.min.js
OUTFILE=build/livereload-script.js

if [ $OUTFILE -nt "$SRCFILE" ]; then
  echo "$SRCFILE up to date"
  exit
fi

echo "$SRCFILE -> $TMPFILE"
esbuild \
  --minify \
  --platform=browser \
  --target=es2017 \
  --outfile="$TMPFILE" \
  "$SRCFILE"

echo "$TMPFILE -> $OUTFILE"
node <<EOF
let fs = require('fs')
let s = fs.readFileSync("$TMPFILE", "utf8")
s = "export default " + JSON.stringify(s) + ";\n"
fs.writeFileSync("$OUTFILE", s, "utf8")
EOF
