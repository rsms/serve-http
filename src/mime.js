const plainText = 'text/plain'
const yaml = 'text/x-yaml'
const markdown = 'text/markdown'
const jpeg = 'image/jpeg'
const html = 'text/html'

export const extToMimeType = {
  'aiff': 'audio/x-aiff',
  'appcache': 'text/cache-manifest',
  'atom': 'application/atom+xml',
  'bmp': 'image/bmp',
  'crx': 'application/x-chrome-extension',
  'css': 'text/css',
  'eot': 'application/vnd.ms-fontobject',
  'gif': 'image/gif',
  'htc': 'text/x-component',
  'html': html, 'htm': html,
  'ico': 'image/vnd.microsoft.icon',
  'ics': 'text/calendar',
  'jpeg': jpeg, 'jpe': jpeg, 'jpg': jpeg,
  'js': 'text/javascript',
  'json': 'application/json',
  'mathml': 'application/mathml+xml',
  'midi': 'audio/midi',
  'mov': 'video/quicktime',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'mpeg': 'video/mpeg',
  'ogg': 'video/ogg',
  'otf': 'font/opentype',
  'pdf': 'application/pdf',
  'png': 'image/png',
  'rtf': 'application/rtf',
  'svg': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  'tar': 'application/x-tar',
  'tiff': 'image/tiff',
  'ttf': 'font/truetype',
  'wav': 'audio/x-wav',
  'webm': 'video/webm',
  'wasm': 'application/wasm',
  'webp': 'image/webp',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'xhtml': 'application/xhtml+xml',
  'xml': 'text/xml',
  'xsl': 'application/xml',
  'xslt': 'application/xslt+xml',
  'zip': 'application/zip',
  'txt': plainText,
  'ninja': plainText,
  'md': markdown, 'markdown': markdown, 'mdown': markdown,
  'yaml': yaml, 'yml': yaml,
  'rb':  'text/ruby',
  'ts':  'text/typescript',
  'sh':  'text/x-sh',
  'go':  'text/x-go',
  'py':  'text/x-python',
  'php': 'text/x-php',
}

extToMimeType["aif"] = extToMimeType["aiff"]
extToMimeType["manifest"] = extToMimeType["appcache"]
extToMimeType["mid"] = extToMimeType["midi"]
extToMimeType["mpg"] = extToMimeType["mpeg"]
extToMimeType["ogv"] = extToMimeType["ogg"]
extToMimeType["svgz"] = extToMimeType["svg"]
extToMimeType["tif"] = extToMimeType["tiff"]
extToMimeType["xht"] = extToMimeType["xhtml"]
