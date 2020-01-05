import { lstat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const readLStat = async (url, { nullIfNotFound = false } = {}) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return lstatNaive(fileSystemPath, {
    ...(nullIfNotFound
      ? {
          handleNotFoundError: () => null,
        }
      : {}),
  })
}

const lstatNaive = (
  fileSystemPath,
  { handleNotFoundError = null, handlePermissionDeniedError = null } = {},
) => {
  return new Promise((resolve, reject) => {
    lstat(fileSystemPath, (error, lstatObject) => {
      if (error) {
        if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error))
        } else if (handleNotFoundError && error.code === "ENOENT") {
          resolve(handleNotFoundError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(lstatObject)
      }
    })
  })
}
