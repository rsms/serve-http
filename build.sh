#!/bin/bash -e
cd "$(dirname "$0")"

export PATH=$PWD/node_modules/.bin:$PATH

DEBUG=false
ROLLUP_ARGS=
if [[ "$1" == "-w" ]]; then
  ROLLUP_ARGS=--watch
  DEBUG=true
  shift
fi
if [[ "$1" == "-g" ]]; then
  DEBUG=true
  shift
fi

PROGRAM=serve-http

VERSION=$(node -p 'require("./package.json").version')
if [[ -d .git ]]; then
  VERSION="$VERSION+$(git rev-parse --short HEAD)"
fi

HEADER_COMMENT="$PROGRAM $VERSION"
PROJECT_URL=$(node -p 'require("./package.json").homepage||""')
if [[ "$PROJECT_URL" != "" ]]; then
  HEADER_COMMENT="$HEADER_COMMENT $PROJECT_URL"
fi

# ----------------------------------------------------------------------------
# dependencies

mkdir -p build

if [[ "misc/livereload.js" -nt "build/livereload-script.js" ]]; then
  echo "terser misc/livereload.js -> build/.livereload.js"
  NODE_ENV=production terser -c -m -- misc/livereload.js > build/.livereload.js

  CCOMPILER=$(node -e "process.stdout.write(require('google-closure-compiler/lib/utils').getNativeImagePath())")
  echo "closure-compiler build/.livereload.js -> build/livereload.js"
  $CCOMPILER \
    -O=SIMPLE \
    --js=build/.livereload.js \
    --js_output_file=build/livereload.js \
    -W QUIET \
    --language_in=ECMASCRIPT_2015 \
    --language_out=ECMASCRIPT_2015 \
    --env=BROWSER \
    --assume_function_wrapper \
    --charset=UTF-8

  rm build/.livereload.js

  echo "js build/livereload.js -> build/livereload-script.js"
  node <<_JS
  let fs = require('fs')
  let s = fs.readFileSync("build/livereload.js", "utf8")
  s = "export default " + JSON.stringify(s) + ";\n"
  fs.writeFileSync("build/livereload-script.js", s, "utf8")
_JS
fi

# ----------------------------------------------------------------------------
# build program

if [ ! -f build/$PROGRAM.g ]; then
  touch build/$PROGRAM.g
  chmod +x build/$PROGRAM.g
fi

# VERSION=$VERSION DEBUG=$DEBUG rollup -c misc/rollup.config.js

rollup $ROLLUP_ARGS \
  -o build/$PROGRAM.g \
  --format cjs \
  --sourcemap \
  --no-freeze \
  --preferConst \
  --no-esModule \
  --intro 'try { require("source-map-support").install() }catch(_){}; '"const VERSION='$VERSION',DEBUG=$DEBUG,WITH_LIVERELOAD=true;" \
  --banner '#!/usr/bin/env node' \
  src/main.js

# NODE_ENV=production terser \
#   --ecma 8 \
#   --beautify 'ecma=8,indent_level=2,keep_quoted_props=true,width=100,comments="all"' \
#   -d DEBUG=false \
#   -- build/$PROGRAM.g > $PROGRAM.g

# ----------------------------------------------------------------------------
# post processing

if ! $DEBUG; then

# strip comments
echo "strip-comments build/$PROGRAM.g -> build/.$PROGRAM.g.prep"
node <<_JS
let fs = require('fs')
let s = fs.readFileSync("build/${PROGRAM}.g", "utf8")
// replace with whitespace and linebreaks to not mess up sourcemap
s = s.replace(/(?:^|\n\s*)\/\*(?:(?!\*\/).)*\*\//gms, s => {
  let s2 = ""
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) == 0xA) {
      s2 += "\n"
    } else {
      s2 += " "
    }
  }
  return s2
})
fs.writeFileSync("build/.${PROGRAM}.g.prep", s, "utf8")
//let s2 = s.replace("WITH_LIVERELOAD=true", "WITH_LIVERELOAD=false")
//fs.writeFileSync("build/.${PROGRAM}-without-livereload.g.prep", s2, "utf8")
_JS

  if [[ "$CCOMPILER" == "" ]]; then
    CCOMPILER=$(node -e "process.stdout.write(require('google-closure-compiler/lib/utils').getNativeImagePath())")
  fi

  echo "closure-compiler build/.${PROGRAM}.g.prep -> $PROGRAM"
  $CCOMPILER \
    -O=SIMPLE \
    --js=build/.${PROGRAM}.g.prep \
    --js_output_file=$PROGRAM \
    -W QUIET \
    --language_in=ECMASCRIPT_2018 \
    --language_out=ECMASCRIPT_2018 \
    --env=CUSTOM \
    --externs=misc/closure-compiler-externs.js \
    \
    --module_resolution=NODE \
    --package_json_entry_names=esnext:main,browser,main \
    --assume_function_wrapper \
    --create_source_map=$PROGRAM.map \
    --source_map_input="build/.${PROGRAM}.g.prep|build/$PROGRAM.g.map" \
    \
    --charset=UTF-8 \
    --output_wrapper="$(printf "#!/usr/bin/env node\n// $HEADER_COMMENT\n%%output%%\n//#sourceMappingURL=$PROGRAM.map")"

  rm build/.${PROGRAM}.g.prep
  chmod +x $PROGRAM
fi
