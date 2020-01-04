import { lstat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { resolveUrl } from "./resolveUrl.js"
import { grantPermission } from "./grantPermission.js"

export const readLStat = async (
  url,
  { autoGrantRequiredPermissions = true, nullIfNotFound = false } = {},
) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return lstatNaive(fileSystemPath, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            /*
            if we don't have the right to read lstat
            it's because a parent or ancestor directory is not readable
            we could recursively read all parent directory to auto grant the rights
            to read the directory content up to the file
            but that's something that looks too complex to be desirable
            */
            const directoryUrl = resolveUrl(
              fileSystemUrl.endsWith("/") ? "../" : "./",
              fileSystemUrl,
            )
            const restoreDirectoryPermission = await grantPermission(directoryUrl, {
              read: true,
              execute: true,
            })
            const restorePermission = await grantPermission(fileSystemUrl, {
              read: true,
              // execute: true,
            })

            try {
              const stat = await lstatNaive(fileSystemPath)
              return stat
            } finally {
              await restoreDirectoryPermission()
              await restorePermission()
            }
          },
        }
      : {}),
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
