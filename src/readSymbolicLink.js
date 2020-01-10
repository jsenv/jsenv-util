import { readlink } from "fs"
import { replaceBackSlashesWithSlashes } from "./internal/replaceBackSlashesWithSlashes.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { fileSystemPathToUrl } from "./fileSystemPathToUrl.js"
import { isFileSystemPath } from "./isFileSystemPath.js"

export const readSymbolicLink = (url) => {
  const symbolicLinkUrl = assertAndNormalizeFileUrl(url)
  const symbolicLinkPath = urlToFileSystemPath(symbolicLinkUrl)

  return new Promise((resolve, reject) => {
    readlink(symbolicLinkPath, (error, resolvedPath) => {
      if (error) {
        reject(error)
      } else {
        resolve(
          isFileSystemPath(resolvedPath)
            ? fileSystemPathToUrl(resolvedPath)
            : replaceBackSlashesWithSlashes(resolvedPath),
        )
      }
    })
  })
}
