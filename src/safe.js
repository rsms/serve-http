const os = require("os")
const fs = require("fs")
const Path = require("path")

export function checkSafePubdir(pubdirRealpath) {
  // If this socket will be opened to the local network, only allow serving a
  // directory inside the home directory. Prevent people from serving up their
  // SSH keys to the local network unintentionally.
  let home = os.homedir()
  if (!home) {
    return "no home directory"
  }

  home = fs.realpathSync(Path.resolve(home))
  if (!pubdirRealpath.startsWith(home)) {
    return "directory not contained inside your home directory"
  }

  // Not sure why someone would do this but it's not a good idea
  if (pubdirRealpath === Path.join(home, '.ssh')) {
    return "directory is inside SSH directory"
  }
}
