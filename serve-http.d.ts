import { Server } from "http"

export interface ServerConfig {
  port?            :number  // bind to port. If falsy, some free user-space port is assigned.
  host?            :string  // bind to host (default "localhost")
  public?          :boolean // bind to public address; make server accessible to the outside world.
  pubdir?          :string  // directory to serve. (default "."; current directory.)
  quiet?           :boolean // don't log anything but errors.
  logRequests?     :boolean // log HTTP requests (ignored if quiet=true)
  defaultMimeType? :string  // mime type for unknown file types.
  indexFilename?   :string  // file to serve for directory requests (def. "index.html")
  dirlist?         :DirlistOptions|boolean
  livereload?      :LiveReloadOptions|boolean
}

export interface DirlistOptions {
  disable?    :boolean  // disable directory listing.
  showHidden? :boolean  // include files which name starts with "."
}

export interface LiveReloadOptions {
  disable? :boolean  // disable live reload
  port?    :number   // livereload server bind port. (default based on server port)
}

// Start a server
export function createServer(config? :ServerConfig) :Server
