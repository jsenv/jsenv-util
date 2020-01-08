import { lstat, stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermissionsOnFileSystemNode } from "./grantPermissionsOnFileSystemNode.js"

export const readFileSystemNodeStat = async (
  source,
  { nullIfNotFound = false, followLink = true } = {},
) => {
  if (source.endsWith("/")) source = source.slice(0, -1)

  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const handleNotFoundOption = nullIfNotFound
    ? {
        handleNotFoundError: () => null,
      }
    : {}

  return readStat(sourcePath, {
    followLink,
    ...handleNotFoundOption,
    handlePermissionDeniedError: async (error) => {
      // Windows can EPERM on stat
      try {
        const restorePermission = await grantPermissionsOnFileSystemNode(sourceUrl, {
          read: true,
          write: true,
          execute: true,
        })

        try {
          const stats = await readStat(sourcePath, {
            followLink,
            ...handleNotFoundOption,
            // could not fix the permission error, give up and throw original error
            handlePermissionDeniedError: () => {
              throw error
            },
          })
          return stats
        } finally {
          await restorePermission()
        }
      } catch (e) {
        // failed to grant permissions, throw original error as well
        throw error
      }
    },
  })
}

const readStat = (
  sourcePath,
  { followLink, handleNotFoundError = null, handlePermissionDeniedError = null } = {},
) => {
  const nodeMethod = followLink ? stat : lstat

  return new Promise((resolve, reject) => {
    nodeMethod(sourcePath, (error, statsObject) => {
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
