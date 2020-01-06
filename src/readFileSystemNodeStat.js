import { lstat, stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermissionsOnFileSystemNode } from "./grantPermissionsOnFileSystemNode.js"

export const readFileSystemNodeStat = async (
  source,
  { nullIfNotFound = false, followSymbolicLink = true } = {},
) => {
  if (source.endsWith("/")) source = source.slice(0, -1)

  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  return readStat(sourcePath, {
    followSymbolicLink,
    ...(nullIfNotFound
      ? {
          handleNotFoundError: () => null,
        }
      : {}),
    handlePermissionDeniedError: async () => {
      // Windows can EPERM on stat
      const restorePermission = await grantPermissionsOnFileSystemNode(sourceUrl, {
        read: true,
        write: true,
        execute: true,
      })
      try {
        const stat = await readStat(sourcePath)
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
