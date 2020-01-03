import { symlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeSymbolicLink = (url, targetUrl) => {
  const symbolicLinkUrl = assertAndNormalizeFileUrl(url)
  const symbolicLinkTargetUrl = assertAndNormalizeFileUrl(targetUrl)

  const symbolicLinkPath = urlToFileSystemPath(symbolicLinkUrl)
  const symbolicLinkTargetPath = urlToFileSystemPath(symbolicLinkTargetUrl)
  return new Promise((resolve, reject) => {
    symlink(symbolicLinkPath, symbolicLinkTargetPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
