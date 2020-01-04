import { readdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { grantPermission } from "./grantPermission.js"

export const readDirectory = async (url, { autoGrantRequiredPermissions = false } = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return readdirNaive(directoryPath, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            const restoreDirectoryPermission = await grantPermission(directoryUrl, {
              read: true,
              write: true,
              execute: true,
            })
            try {
              const names = await readdirNaive(directoryPath)
              await restoreDirectoryPermission()
              return names
            } finally {
            }
          },
        }
      : {}),
  })
}

const readdirNaive = (directoryPath, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    readdir(directoryPath, (error, names) => {
      if (error) {
        if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(names)
      }
    })
  })
}
