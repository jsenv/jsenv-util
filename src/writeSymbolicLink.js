import { symlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { isFileSystemPath } from "./isFileSystemPath.js"

export const writeSymbolicLink = (destination, target) => {
  const symbolicLinkUrl = assertAndNormalizeFileUrl(destination)

  let targetValue
  if (typeof target === "string") {
    // absolute filesystem path
    if (isFileSystemPath(target)) {
      targetValue = target
    }
    // relative url
    else if (target.startsWith("./") || target.startsWith("../")) {
      targetValue = target
    }
    // absolute url
    else {
      const targetUrl = String(new URL(targetUrl, symbolicLinkUrl))
      targetValue = urlToFileSystemPath(targetUrl)
    }
  } else if (target instanceof URL) {
    targetValue = urlToFileSystemPath(target)
  } else {
    throw new TypeError(`symbolic link target must be a string or an url, received ${target}`)
  }

  const symbolicLinkPath = urlToFileSystemPath(symbolicLinkUrl)
  return new Promise((resolve, reject) => {
    symlink(targetValue, symbolicLinkPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
