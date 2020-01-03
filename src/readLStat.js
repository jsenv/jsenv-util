import { lstat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const readLStat = async (url) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)
  return new Promise((resolve, reject) => {
    lstat(fileSystemPath, (error, lstatObject) => {
      if (error) {
        reject(error)
      } else {
        resolve(lstatObject)
      }
    })
  })
}
