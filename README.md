# serve-http

Simple single-file local web server

- Single file — copy it into your project
- No dependencies
- Livereload
- Safety feature: Only serves local connections unless given explicit command-line argument.
- Safety feature: Refuses to serve directories outside home directory to remote connections.

Install by copying
[`serve-http`](https://raw.githubusercontent.com/rsms/serve-http/master/serve-http)
into your project, or [`npm i serve-http`](https://www.npmjs.com/package/serve-http)

It may also be convenient to install it globally on your machine: `npm i -g serve-http`

```
$ ./serve-http -help
Usage: ./serve-http [options] [<dir>]

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

  ./serve-http
    Serve current directory on some available port

  ./serve-http -p 8080 docs
    Serve directory ./docs locally on port 8080

  ./serve-http -public -no-dirlist
    Serve current directory publicly on some available port,
    without directory listing.

```
