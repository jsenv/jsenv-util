import { dirname } from "path"
import { mkdir } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const createParentDirectories = (url) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)
  return new Promise((resolve, reject) => {
    mkdir(dirname(fileSystemPath), { recursive: true }, (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve()
          return
        }
        reject(error)
        return
      }
      resolve()
    })
  })
}
