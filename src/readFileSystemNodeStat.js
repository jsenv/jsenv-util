import { lstat, stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermission } from "./grantPermission.js"

export const readFileSystemNodeStat = async (
  url,
  { nullIfNotFound = false, followSymbolicLink = true } = {},
) => {
  if (url.endsWith("/")) url = url.slice(0, -1)

  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return readStat(fileSystemPath, {
    followSymbolicLink,
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
        const stat = await readStat(fileSystemPath)
        return stat
      } finally {
        await restorePermission()
      }
    },
  })
}

const readStat = (
  fileSystemPath,
  { followSymbolicLink, handleNotFoundError = null, handlePermissionDeniedError = null } = {},
) => {
  const nodeMethod = followSymbolicLink ? stat : lstat

  return new Promise((resolve, reject) => {
    nodeMethod(fileSystemPath, (error, statsObject) => {
      if (error) {
        if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error))
        } else if (handleNotFoundError && error.code === "ENOENT") {
          resolve(handleNotFoundError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(statsObject)
      }
    })
  })
}
