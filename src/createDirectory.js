import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermission } from "./grantPermission.js"
import { resolveDirectoryUrl } from "./resolveDirectoryUrl.js"

export const createDirectory = (url, { autoGrantRequiredPermissions = false } = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return createDirectoryNaive(directoryPath, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            const parentDirectoryUrl = resolveDirectoryUrl("../", directoryUrl)
            const restoreParentDirectoryPermission = await grantPermission(parentDirectoryUrl, {
              read: true,
              write: true,
              execute: true,
            })

            try {
              await createDirectoryNaive(directoryPath)
            } finally {
              await restoreParentDirectoryPermission()
            }
          },
        }
      : {}),
  })
}

const createDirectoryNaive = (directoryPath, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    mkdir(directoryPath, (error) => {
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
