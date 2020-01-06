import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeDirectory = (destination) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(destination)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return createDirectoryNaive(directoryPath)
}

const createDirectoryNaive = (directoryPath, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    mkdir(directoryPath, { recursive: true }, (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve()
        } else if (handlePermissionDeniedError && error.code === "EACCES") {
          resolve(handlePermissionDeniedError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
