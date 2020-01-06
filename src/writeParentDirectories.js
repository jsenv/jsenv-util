import { dirname } from "path"
import { mkdir } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeParentDirectories = (destination) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination)
  const destinationPath = urlToFileSystemPath(destinationUrl)
  const destinationParentPath = dirname(destinationPath)
  return new Promise((resolve, reject) => {
    mkdir(destinationParentPath, { recursive: true }, (error) => {
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
