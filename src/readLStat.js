import { lstat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermission } from "./grantPermission.js"

export const readLStat = async (url, { nullIfNotFound = false } = {}) => {
  if (url.endsWith("/")) url = url.slice(-1)

  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return lstatNaive(fileSystemPath, {
    ...(nullIfNotFound
      ? {
          handleNotFoundError: () => null,
        }
      : {}),
    handlePermissionDeniedError: async () => {
      // Windows can EPERM on stat
      const restorePermission = await grantPermission(fileSystemUrl, {
        read: true,
        write: true,
        execute: true,
      })
      try {
        const lstat = await lstatNaive(fileSystemPath)
        return lstat
      } finally {
        await restorePermission()
      }
    },
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
