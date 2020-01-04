import { unlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { resolveUrl } from "./resolveUrl.js"
import { grantPermission } from "./grantPermission.js"

export const removeFile = (value, { autoGrantRequiredPermissions = false } = {}) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)

  return removeFileNaive(filePath, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            const directoryUrl = resolveUrl("./", fileUrl)
            const restoreDirectoryPermission = await grantPermission(directoryUrl, {
              write: true,
              execute: true,
            })
            try {
              await removeFileNaive(filePath)
            } finally {
              await restoreDirectoryPermission()
            }
          },
        }
      : {}),
  })
}

const removeFileNaive = (filePath, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        if (error.code === "ENOENT") {
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
