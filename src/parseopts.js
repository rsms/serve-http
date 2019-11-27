import { die } from "./util"

export function parseopts(argv, opts, usage) {
  let args = []
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i]
    if (arg[0] == "-") {
      let k = arg.replace(/^-+/, "")
      if (k == "h" || k == "help") {
        usage()
      }
      if (!(k in opts)) {
        k = k.replace(/-(\w)/g, (_, m) => m[0].toUpperCase())
      }
      if (k in opts) {
        let t = typeof opts[k]
        let v = true
        if (t != "boolean") {
          if ((v = argv[++i]) === undefined) {
            die(`missing value for option ${arg}`)
          }
          if (t == "number") {
            v = Number(v)
            if (isNaN(v)) {
              die(`invalid value ${argv[i]} for option ${arg} (not a number)`)
            }
          }
        }
        opts[k] = v
      } else {
        die(`unknown option ${arg}`)
      }
    } else {
      args.push(arg)
    }
  }
  return args
}
