import { chmod } from "fs"
import { permissionsToBinaryFlags } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { resolveUrl } from "./resolveUrl.js"
import { grantPermission } from "./grantPermission.js"

export const writePermissions = async (
  url,
  permissions,
  { autoGrantRequiredPermissions = true } = {},
) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  permissions = {
    owner: {
      read: getPermissionOrComputeDefault("read", "owner", permissions),
      write: getPermissionOrComputeDefault("write", "owner", permissions),
      execute: getPermissionOrComputeDefault("execute", "owner", permissions),
    },
    group: {
      read: getPermissionOrComputeDefault("read", "group", permissions),
      write: getPermissionOrComputeDefault("write", "group", permissions),
      execute: getPermissionOrComputeDefault("execute", "group", permissions),
    },
    others: {
      read: getPermissionOrComputeDefault("read", "others", permissions),
      write: getPermissionOrComputeDefault("write", "others", permissions),
      execute: getPermissionOrComputeDefault("execute", "others", permissions),
    },
  }
  const binaryFlags = permissionsToBinaryFlags(permissions)

  return chmodNaive(fileSystemPath, binaryFlags, {
    ...(autoGrantRequiredPermissions
      ? {
          handlePermissionDeniedError: async () => {
            // you might not be allowed to update the file mod
            // because of directory I would say
            const directoryUrl = resolveUrl(
              fileSystemUrl.endsWith("/") ? "../" : "./",
              fileSystemUrl,
            )
            const restoreDirectoryPermission = await grantPermission(directoryUrl, {
              read: true,
              write: true,
              execute: true,
            })
            // const restoreFilePermission = await grantPermission(fileSystemUrl, {
            //   read: true,
            //   write: true,
            //   execute: true,
            // })
            try {
              await chmodNaive(fileSystemPath, binaryFlags)
              await restoreDirectoryPermission()
            } finally {
              // await restoreFilePermission()
            }
          },
        }
      : {}),
  })
}

const chmodNaive = (fileSystemPath, binaryFlags, { handlePermissionDeniedError = null } = {}) => {
  return new Promise((resolve, reject) => {
    chmod(fileSystemPath, binaryFlags, (error) => {
      if (error) {
        if (handlePermissionDeniedError && error.code === "EACCES") {
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

const actionLevels = { read: 0, write: 1, execute: 2 }
const subjectLevels = { others: 0, group: 1, owner: 2 }

const getPermissionOrComputeDefault = (action, subject, permissions) => {
  if (subject in permissions) {
    const subjectPermissions = permissions[subject]
    if (action in subjectPermissions) {
      return subjectPermissions[action]
    }

    const actionLevel = actionLevels[action]
    const actionFallback = Object.keys(actionLevels).find(
      (actionFallbackCandidate) =>
        actionLevels[actionFallbackCandidate] > actionLevel &&
        actionFallbackCandidate in subjectPermissions,
    )
    if (actionFallback) {
      return subjectPermissions[actionFallback]
    }
  }

  const subjectLevel = subjectLevels[subject]
  // do we have a subject with a stronger level (group or owner)
  // where we could read the action permission ?
  const subjectFallback = Object.keys(subjectLevels).find(
    (subjectFallbackCandidate) =>
      subjectLevels[subjectFallbackCandidate] > subjectLevel &&
      subjectFallbackCandidate in permissions,
  )
  if (subjectFallback) {
    const subjectPermissions = permissions[subjectFallback]
    return action in subjectPermissions
      ? subjectPermissions[action]
      : getPermissionOrComputeDefault(action, subjectFallback, permissions)
  }

  return false
}
