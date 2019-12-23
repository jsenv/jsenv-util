import { urlToScheme } from "./urlToScheme.js"

export const urlToRessource = (url) => {
  const scheme = urlToScheme(url)

  if (scheme === "file") {
    return url.slice("file://".length)
  }

  if (scheme === "https" || scheme === "http") {
    // remove origin
    const afterProtocol = url.slice(scheme.length + "://".length)
    const pathnameSlashIndex = afterProtocol.indexOf("/", "://".length)
    return afterProtocol.slice(pathnameSlashIndex)
  }

  return url.slice(scheme.length + 1)
}
