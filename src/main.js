import { parseopts } from "./parseopts"
import { startServer } from "./server"
import { die, dlog } from "./util"

const Path = require("path")

function usage() {
  let v = process.argv
  let prog = v[0].endsWith("node") ? Path.relative(process.cwd(), Path.resolve(v[1])) : v[0]
  let progl = "./" + prog
  if (process.env["_"] == progl) {
    // common case: ./serve-http (in cwd)
    prog = progl
  }
  let s = `
Usage: ${prog} [options] [<dir>]

<dir>
  Directory to serve files from. Defaults to the current directory.

Options:
  -p, -port <port>  Listen on specific <port>
  -host <host>      Bind to <host> instead of "localhost"
  -public           Accept connections from anywhere (same as -host "")
  -quiet            Disable request logging
  -no-livereload    Disable livereload
  -no-dirlist       Disable directory listing
  -h, -help         Show help and exit
  -version          Print version to stdout and exit

Examples:

  ${prog}
    Serve current directory on some available port

  ${prog} -p 8080 docs
    Serve directory ./docs locally on port 8080

  ${prog} -public -no-dirlist
    Serve current directory publicly on some available port,
    without directory listing.

  `.trim()+"\n"
  if (!WITH_LIVERELOAD) {
    s = s.replace(/^\s+livereload.+\n/g, "")
  }
  console.log(s)
  process.exit(0)
}
const opts = {
  // available command-line options with default values
  port: 0, p: 0,
  host: "localhost",
  public: false,
  quiet: false,
  version: false,
  noLivereload: false,
  noDirlist: false,  // disable directory listing

  pubdir: ".",
  defaultMimeType: "application/octet-stream",
  expireImmediately: false,  // include distant-past "Expires" response header
  indexFilename: "index.html",
  dirlistShowHidden: false,  // include files starting with "." in directory listing
}

function main() {
  let args = parseopts(process.argv.slice(2), opts, usage)

  if (opts.version) {
    console.log(VERSION)
    process.exit(0)
  }

  opts.port = opts.port || opts.p

  // dlog({ opts, args })

  if (args.length > 0) {
    if (args.length > 1) {
      console.error(`ignoring extra arguments: ${args.slice(1).join(" ")}`)
    }
    opts.pubdir = args[0]
  }

  if (opts.public && opts.host == "localhost") {
    opts.host = ""
  }

  startServer(opts)
}

main()
