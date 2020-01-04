import { lstat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermission } from "./grantPermission.js"

export const readLStat = async (url, { autoGrantRequiredPermissions = true } = {}) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return lstatNaive(fileSystemPath, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            // HERE there is an infinite loop of trying to read the lstat to be able to
            // restore the permission but we don't have the right to read before hand
            // to solve this grantPermission should handle permission denied error
            // and understand he cannot read permission and autogrant read to himself
            const restorePermission = await grantPermission(fileSystemUrl, {
              read: true,
              write: true,
              execute: true,
            })

            try {
              const stat = await lstatNaive(fileSystemPath)
              return stat
            } finally {
              await restorePermission()
            }
          },
        }
      : {}),
  })
}

const lstatNaive = (fileSystemPath, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    lstat(fileSystemPath, (error, lstatObject) => {
      if (error) {
        if (handlePermissionDeniedError && error.code === "EACCES") {
          resolve(handlePermissionDeniedError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(lstatObject)
      }
    })
  })
}
