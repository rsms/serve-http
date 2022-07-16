# serve-http

Simple single-file local web server

`npm i -g serve-http`

- Single file without dependencies — copy it into your project.
- Livereload — HTML pages reload automatically in web browsers as they change.
- Safety feature: Only serves local connections unless given explicit command-line argument.
- Safety feature: Refuses to serve directories outside home directory to remote connections.

Install through [`npm i -g serve-http`](https://www.npmjs.com/package/serve-http) or by copying
[`serve-http`](https://raw.githubusercontent.com/rsms/serve-http/master/serve-http)
into your project (no dependencies; entire thing contained in a single small file.)

```
$ ./serve-http -help
Usage: serve-http [options] [<dir>]

<dir>
  Directory to serve files from. Defaults to the current directory.

Options:
  -p, -port <port>  Listen on specific <port>
  -host <host>      Bind to <host> instead of "localhost"
  -public           Accept connections from anywhere (same as -host "")
  -q, -quiet        Don't log requests
  -no-livereload    Disable livereload
  -no-dirlist       Disable directory listing
  -dirlist-hidden   Show files beginning with "." in directory listings
  -h, -help         Show help and exit
  -version          Print version to stdout and exit

Examples:

  serve-http
    Serve current directory on some available port

  serve-http -p 8080 docs
    Serve directory ./docs locally on port 8080

  serve-http -public -no-dirlist
    Serve current directory publicly on some available port,
    without directory listing.

```

## JavaScript API

serve-http can also be used as a library:

```js
const { createServer } = require("serve-http")
const server = createServer({ pubdir: __dirname, port: 1234 })
// `server` is a standard nodejs http server instance.
```

See TypeScript type definitions for documentation of the API:
[`serve-http.d.ts`](serve-http.d.ts)
