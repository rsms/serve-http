import { fmt } from "./fmt"

const fs = require("fs")


export const dlog = (
  DEBUG ? function() {
    if (typeof arguments[0] == "string") {
      console.log("D " + fmt.apply(null, arguments))
    } else {
      console.log.apply(console, ["D"].concat([].slice.call(arguments)))
    }
  } : function(){}
)


export function die(err) {
  console.error((!err || typeof err == "string") ? err : String(err.stack||err))
  process.exit(1)
}


export function addrToURL(addr) {
  let host = addr.address
  if (host == "0.0.0.0") {
    host = "127.0.0.1"
  } else if (addr.family == "IPv6") {
    host = `localhost`
  }
  return `http://${host}:${addr.port}`
}


export function stat(path, options) {
  return new Promise((resolve, reject) => {
    fs.stat(path, options, (err, stats) => {
      if (!err) {
        resolve(stats)
      } else if (err.code == "ENOENT") {
        resolve(null)
      } else {
        reject(err)
      }
    })
  })
}
