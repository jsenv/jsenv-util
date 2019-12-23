import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const createDirectory = (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return new Promise((resolve, reject) => {
    mkdir(directoryPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
