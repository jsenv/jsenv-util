import { symlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { isFileSystemPath } from "./isFileSystemPath.js"

export const writeSymbolicLink = (url, targetUrl) => {
  const symbolicLinkUrl = assertAndNormalizeFileUrl(url)

  let symbolicLinkTargetPath
  if (typeof targetUrl === "string") {
    // absolute filesystem path
    if (isFileSystemPath(targetUrl)) {
      symbolicLinkTargetPath = targetUrl
    }
    // relative url
    else if (targetUrl.startsWith("./") || targetUrl.startsWith("../")) {
      symbolicLinkTargetPath = targetUrl
    }
    // absolute url
    else {
      const symbolicLinkTargetUrl = String(new URL(targetUrl, symbolicLinkUrl))
      symbolicLinkTargetPath = urlToFileSystemPath(symbolicLinkTargetUrl)
    }
  } else if (targetUrl instanceof URL) {
    symbolicLinkTargetPath = urlToFileSystemPath(targetUrl)
  }

  const symbolicLinkPath = urlToFileSystemPath(symbolicLinkUrl)
  return new Promise((resolve, reject) => {
    symlink(symbolicLinkTargetPath, symbolicLinkPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
