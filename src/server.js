import { fmt } from "./fmt"
import { extToMimeType } from "./mime"
import { checkSafePubdir } from "./safe"
import { die, addrToURL, dlog, stat } from "./util"
import { createDirectoryListingHTML } from "./dirlist"
import { createServer as createLivereloadServer } from "./livereload"
import livereloadJSBody from "../build/livereload-script"

const createServer = require("http").createServer
const urlparse = require("url").parse
const Path = require("path")
const fs = require("fs")
const promisify = require("util").promisify

const readfile = promisify(fs.readFile)
const writefile = promisify(fs.writeFile)

let pubdir = ""  // absolute path
let server = null
let livereloadServer = null
let log = ()=>{}


export function startServer(opts) {
  pubdir = Path.resolve(opts.pubdir)
  try {
    pubdir = fs.realpathSync(pubdir)
  } catch (err) {
    if (err.code == "ENOENT") {
      die(`Directory ${pubdir} does not exist`)
    }
    throw err
  }

  let handler = formHandlerChain([
    !opts.quiet && requestLogger(),
    handleRequest,
  ])

  let handler2 = (req, res) => handler(req, res).catch(err => {
    console.error("Internal server error:", err.stack||String(err))
    return endResponse(res, 500, `Internal server error: ${err}`)
  })

  server = createServer(handler2)
  server.options = opts

  if (!opts.quiet) {
    log = function() { console.log(fmt.apply(null, arguments)) }
  }

  server.localOnly = true
  if (opts.host != "localhost" && opts.host != "127.0.0.1" && opts.host != "::1") {
    server.localOnly = false
    let msg = checkSafePubdir(pubdir)
    if (msg) {
      die("refusing to allow external connections for security reasons: " + msg)
    }
  }

  let port = opts.port < 1 ? undefined : opts.port
  server.listen(port, opts.host, () => {
    let addr = server.address()

    if (!opts.quiet) {
      let dir = Path.relative(".", pubdir)
      if (dir[0] != ".") {
        dir = "./" + dir
      } else if (dir.startsWith("../")) {
        dir = pubdir
      }
      log(
        `serving %s%s at %s/`,
        dir,
        server.localOnly ? "" : " PUBLICLY TO THE INTERNET",
        addrToURL(addr)
      )
    }

    if (WITH_LIVERELOAD && !server.options.noLivereload && !port) {
      startLivereloadServer(addr.port + 1, opts.host)
    }

    // DEBUG && setTimeout(() => {
    //   require("http").get("http://localhost:" + addr.port + "/dir/", async res => {
    //     dlog("headers:\n  %s",
    //       Object.keys(res.headers).map(k => `${k}: ${res.headers[k]}`).join("\n  ")
    //     )
    //     let body = await readStream(res)
    //     console.log("body:", body.toString("utf8"))
    //   })
    // }, 100)
  })

  if (WITH_LIVERELOAD && !server.options.noLivereload && port) {
    startLivereloadServer(port + 10000, opts.host)
  }

  return server
}


function startLivereloadServer(port, bindHost) {
  if (WITH_LIVERELOAD) {
    livereloadServer = createLivereloadServer({
      port,
      bindHost,
    }, () => {
      livereloadServer.watch(pubdir)
      let addr = livereloadServer.address()
      log(`livereload server listening on ws://${addr.address}:${addr.port}`)
    })
  }
}


function formHandlerChain(handlers) {
  // [ h1, h2, h3 ]
  // ->
  // (req, res) =>
  //   h1(req, res).then(() =>
  //     h2(req, res).then(() =>
  //       h3(req, res)))
  //
  handlers = handlers.filter(f => !!f)
  if (handlers.length == 1) {
    return handlers[0]
  }
  return handlers.reduce((prev, next) =>
    (req, res) =>
      prev(req, res).then((req1, res1) =>
        next(req1||req, res1||res) )
  )
}


function requestLogger() {
  return async (req, res) => {
    let end = res.end, writeHead = res.writeHead, statusCode

    res.writeHead = (code, headers) => {
      res.writeHead = writeHead
      res.writeHead(code, headers)
      res.__statusCode = statusCode = code
      res.__headers = headers || {}
    }

    res.end = (chunk, encoding) => {
      res.end = end
      res.end(chunk, encoding)
      let addr = (
        req.socket &&
        (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress))
      )
      let time = (new Date).toUTCString()
      let httpv = req.httpVersionMajor + '.' + req.httpVersionMinor
      let status = statusCode || res.statusCode
      let ua = req.headers['user-agent'] || '-'
      console.log(`${addr} [${time}] "${req.method} ${req.url} HTTP/${httpv}" ${status} ${ua}`)
    }
  }
}


function endResponse(res, status, str) {
  let body = str ? Buffer.from(str.trim() + "\n", "utf8") : undefined
  res.writeHead(status, {
    "Content-Type": "text/plain",
    "Content-Length": body ? String(body.length) : "0",
  })
  res.end(body)
}


function replyNotFound(req, res) {
  endResponse(res, 404, `404 not found ${req.pathname}`, "utf8")
}


function readStream(req) {
  return new Promise(resolve => {
    if (req.body && req.body instanceof Buffer) {
      return resolve(req.body)
    }
    let body = []
    req.on('data', data => body.push(data))
    req.on('end', () => {
      resolve(req.body = Buffer.concat(body))
    })
  })
}


async function handleRequest(req, res) {
  req.pathname = decodeURIComponent(urlparse(req.url).pathname).replace(/^\.{2,}|\.{2,}$/g, "")

  // Only allow writing over files if the server can only accept local connections
  if (req.method === "POST" && server.localOnly) {
    return handlePOSTFileRequest(req, res)
  }

  if (req.method === "GET") {
    if (WITH_LIVERELOAD && livereloadServer && req.pathname == "/livereload.js") {
      return handleGETLivereload(req, res)
    }
    return handleGETFileRequest(req, res)
  }

  endResponse(res, 500, `Unsupported method ${req.method}`)
}


let livereloadRes = null

async function handleGETLivereload(req, res) {
  if (WITH_LIVERELOAD) {
    if (!livereloadRes) {
      let body = Buffer.from(livereloadJSBody, "utf8")
      livereloadRes = {
        body,
        header: {
          "Content-Type": "text/javascript",
          "Content-Length": String(body.length),
        }
      }
    }
    res.writeHead(200, livereloadRes.header)
    res.end(livereloadRes.body)
  }
}


async function handleGETFileRequest(req, res) {
  let filename = Path.join(pubdir, req.pathname)
  let st = await stat(filename)
  if (!st) {
    return replyNotFound(req, res)
  }
  if (st.isFile()) {
    return serveFile(req, res, filename, st)
  }
  if (st.isDirectory()) {
    return serveDir(req, res, filename, st)
  }
  endResponse(res, 404, `404 not found ${req.pathname} (unreadable file type)`, "utf8")
}


async function handlePOSTFileRequest(req, res) {
  // Write files with POST. Example:
  //   curl -X POST -H "Content-Type: text/plain" -d "Hello" http://localhost:8090/hello.txt
  //
  let remoteAddr = req.socket.address().address
  if (remoteAddr != "127.0.0.1" && remoteAddr != "::1") {
    return endResponse(res, 403, "Forbidden")
  }

  let origin = req.headers.origin && urlparse(req.headers.origin).hostname
  if (origin) {
    // if (origin !== 'localhost' && origin !== '127.0.0.1' && origin !== "::1") {
    //   return endResponse(res, 403, "Forbidden")
    // }
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  let filename = Path.join(pubdir, req.pathname)
  let [st, body] = await Promise.all([
    stat(filename),
    readStream(req)
  ])
  if (st && st.isDirectory()) {
    return endResponse(res, 409, "Conflict: Directory exists at path")
  }
  await writefile(filename, body)
  if (st) {
    endResponse(res, 200, "File replaced")
  } else {
    endResponse(res, 201, "File created")
  }
}


async function serveFile(req, res, filename, st) {
  const opts = server.options
  res.statusCode = 200

  let mimeType = extToMimeType[Path.extname(filename).substr(1)] || opts.defaultMimeType
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Last-Modified', st.mtime.toUTCString())
  res.setHeader('ETag', etag(st))
  if (opts.expireImmediately) {
    res.setHeader('Expires', 'Sun, 11 Mar 1984 12:00:00 GMT')
  }

  let body = await readfile(filename)

  if (mimeType == "text/html" && !opts.nolivereload) {
    body = preprocessHtml(body)
  }

  res.setHeader('Content-Length', body.length)

  if (opts.emulateSlowConnection) {
    let chunkTime = 1000 // Stream each file out over a second
    let chunkCount = 100 // The number of chunks to deliver the file in
    let chunkSize = Math.ceil(body.length / chunkCount)
    function next() {
      if (body.length > 0) {
        res.write(body.slice(0, chunkSize))
        body = body.slice(chunkSize)
        setTimeout(next, chunkTime / chunkCount)
      } else {
        res.end()
      }
    }
    return next()
  }

  res.end(body)
}


async function serveDir(req, res, filename, st) {
  dlog("serveDir %r", req.pathname)
  const opts = server.options

  let indexFile = Path.join(filename, opts.indexFilename)
  let indexFileSt = await stat(indexFile)
  if (indexFileSt && indexFileSt.isFile()) {
    return serveFile(req, res, indexFile, indexFileSt)
  }

  if (opts.noDirlist) {
    return replyNotFound(req, res)
  }

  if (req.pathname[req.pathname.length - 1] != "/") {
    // redirect to "/"
    res.writeHead(303, {
      "Expires": "Sun, 11 Mar 1984 12:00:00 GMT",
      "Location": req.pathname + "/",
      "Content-Length": "0",
    })
    res.end()
    return
  }

  let body = await createDirectoryListingHTML(filename, req.pathname, opts)
  body = Buffer.from(body, "utf8")
  res.writeHead(200, {
    "Expires": "Sun, 11 Mar 1984 12:00:00 GMT",
    "Content-Type": "text/html",
    "Content-Length": String(body.length),
  })
  res.end(body)
}


function etag(st) {
  return `"${st.mtimeMs.toString(36)}-${st.ino.toString(36)}-${st.size.toString(36)}"`
}


function preprocessHtml(body) {
  // add livereload script to html
  let s = body.toString("utf8")
  let i = s.indexOf("</head>")
  if (i == -1) { i = s.indexOf("</body>") }
  if (i != -1) {
    let port = livereloadServer.config.port
    let script = `<script async src="/livereload.js?port=${port}"></script>`
    s = s.substr(0, i) + script + s.substr(i)
    body = Buffer.from(s, "utf8")
  }
  return body
}
