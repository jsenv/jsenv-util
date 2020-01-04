import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const createDirectory = (value, { autoGrantRequiredPermissions = false } = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return new Promise((resolve, reject) => {
    mkdir(directoryPath, (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve()
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
