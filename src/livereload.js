/*
livereload by Joshua Peek, converted from CoffeeScript to JS ES6.

livereload.coffee licensed as follows: (MIT)
Copyright (c) 2010 Joshua Peek

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const fs = require('fs')
    , path = require('path')
    , http = require('http')
    , https = require('https')
    , url = require('url')
    , EventEmitter = require('events')

// import * as ws from '../node_modules/ws/index'
// import { WebSocketServer } from '../node_modules/ws/lib/websocket-server'
import { WebSocketServer } from './ws/websocket-server'

let protocol_version = '7';
let defaultPort = 35729;
let defaultExts = [
  "html",
  "css",
  "js",
  "wasm",
  "png",
  "gif",
  "jpg",
  "php",
  "php5",
  "py",
  "rb",
  "erb",
]
let defaultExclusions = [/\.git\//, /\.svn\//, /\.hg\//, /\.DS_Store/];

const dlog = DEBUG ? (s, str) => { s.config.debug && console.log(str) } : function(){}

export class Server extends EventEmitter {
  constructor(config) {
    super()
    let extraExts = config.extraExts
    if (extraExts) {
      delete config.extraExts
    }

    this.config = config = Object.assign({
      // default options
      version: protocol_version,
      port: defaultPort,
      exts: defaultExts,
      exclusions: defaultExclusions,
      applyCSSLive: true,
      originalPath: "",
      overrideURL: "",
      usePolling: false,
    }, config || {})

    if (extraExts && extraExts.length > 0) {
      config.exts = config.exts.concat(extraExts)
    }
  }

  listen(callback) {
    dlog(this, "LiveReload is waiting for a browser to connect...");
    dlog(this,
      "Protocol version: " + this.config.version + "\nExclusions: " +
      this.config.exclusions + "\nExtensions: " + this.config.exts + "\nPolling: " +
      this.config.usePolling + "\n"
    );
    if (this.config.server) {
      this.config.server.listen(this.config.port, this.config.bindHost);
      this.server = new WebSocketServer({
        server: this.config.server
      });
    } else {
      this.server = new WebSocketServer({
        port: this.config.port,
        host: this.config.bindHost,
      });
    }
    this.server.on('connection', this.onConnection.bind(this));
    this.server.on('close', this.onClose.bind(this));
    this.server.on('error', this.onError.bind(this));
    if (callback) {
      return this.server.once('listening', callback);
    }
  }

  address() {
    return this.server && this.server.address()
  }

  onError(err) {
    dlog(this, "Error " + err);
    return this.emit("error", err);
  }

  onConnection(socket) {
    dlog(this, "Browser connected.");
    socket.on('message', (function(_this) {
      return function(message) {
        var data, request;
        dlog(_this, "Client message: " + message);
        request = JSON.parse(message);
        if (request.command === "hello") {
          dlog(_this, "Client requested handshake...");
          dlog(_this, "Handshaking with client using protocol " + _this.config.version + "...");
          data = JSON.stringify({
            command: 'hello',
            protocols: ['http://livereload.com/protocols/official-7', 'http://livereload.com/protocols/official-8', 'http://livereload.com/protocols/official-9', 'http://livereload.com/protocols/2.x-origin-version-negotiation', 'http://livereload.com/protocols/2.x-remote-control'],
            serverName: 'node-livereload'
          });
          socket.send(data);
        }
        if (request.command === "info") {
          return dlog(_this, "Server received client data. Not sending response.");
        }
      };
    })(this));
    socket.on('error', (function(_this) {
      return function(err) {
        return dlog(_this, "Error in client socket: " + err);
      };
    })(this));
    return socket.on('close', (function(_this) {
      return function(message) {
        return dlog(_this, "Client closed connection");
      };
    })(this));
  }

  onClose(socket) {
    return dlog(this, "Socket closed.");
  }

  watch(dir) {
    dlog(this, "Watching " + dir + "...")
    this.watcher = fs.watch(dir, { recursive: true }, (event, filename) => {
      this.filterRefresh(filename)
    })
  }

  filterRefresh(filepath) {
    var delayedRefresh, exts, fileext;
    exts = this.config.exts;
    fileext = path.extname(filepath).substring(1);
    if (exts.indexOf(fileext) !== -1) {
      if (this.config.delay) {
        return delayedRefresh = setTimeout((function(_this) {
          return function() {
            clearTimeout(delayedRefresh);
            return _this.refresh(filepath);
          };
        })(this), this.config.delay);
      } else {
        return this.refresh(filepath);
      }
    }
  }

  refresh(filepath) {
    var data;
    dlog(this, "Reloading: " + filepath);
    data = JSON.stringify({
      command: 'reload',
      path: filepath,
      liveCSS: this.config.applyCSSLive,
      liveImg: this.config.applyImgLive,
      originalPath: this.config.originalPath,
      overrideURL: this.config.overrideURL
    });
    return this.sendAllClients(data);
  }

  alert(message) {
    var data;
    dlog(this, "Alert: " + message);
    data = JSON.stringify({
      command: 'alert',
      message: message
    });
    return this.sendAllClients(data);
  }

  sendAllClients(data) {
    dlog(this, "broadcasting to all clients: " + data)
    this.server.clients.forEach(socket => {
      socket.send(data, error => {
        if (error) { dlog(this, error) }
      })
    })
  }

  debug(str) {
    if (this.config.debug) {
      return console.log(str + "\n");
    }
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
    }
    this.server._server.close();
    return this.server.close();
  }

} // class


export function createServer(config, callback) {
  var app, requestHandler, server;
  if (config == null) {
    config = {};
  }
  requestHandler = function(req, res) {
    if (url.parse(req.url).pathname === '/livereload.js') {
      res.writeHead(200, {
        'Content-Type': 'text/javascript'
      });
      return res.end(fs.readFileSync(__dirname + '/../ext/livereload.js'));
    }
  };
  if (config.https == null) {
    app = http.createServer(requestHandler);
  } else {
    app = https.createServer(config.https, requestHandler);
  }
  if (config.server == null) {
    config.server = app;
  }
  server = new Server(config);
  if (!config.noListen) {
    server.listen(callback);
  }
  return server;
}
