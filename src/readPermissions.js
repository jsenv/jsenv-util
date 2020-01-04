import { lstat } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writePermissions } from "./writePermissions.js"

export const readPermissions = async (url) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  const permissions = await lstatNaive(fileSystemPath, {
    handlePermissionDeniedError: async () => {
      await writePermissions(fileSystemUrl, { owner: { read: true } })
      const stats = await lstatNaive(fileSystemPath)
      const permissions = binaryFlagsToPermissions(stats.mode)
      permissions.owner.read = false
      // restore real file permissions
      await writePermissions(fileSystemUrl, permissions)
      return permissions
    },
  })
  return permissions
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
        resolve(binaryFlagsToPermissions(lstatObject.mode))
      }
    })
  })
}
