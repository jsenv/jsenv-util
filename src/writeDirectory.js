import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeDirectory = (destination, { uselessError = false } = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(destination)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return createDirectoryNaive(directoryPath, {
    ...(uselessError ? {} : { handleExistsError: () => undefined }),
  })
}

const createDirectoryNaive = (directoryPath, { handleExistsError = null } = {}) => {
  return new Promise((resolve, reject) => {
    mkdir(directoryPath, { recursive: true }, (error) => {
      if (error) {
        if (handleExistsError && error.code === "EEXIST") {
          resolve(handleExistsError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
