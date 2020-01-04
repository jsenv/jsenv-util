import { copyFile as copyFileNode } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { testPermission } from "./testPermission.js"
import { grantPermission } from "./grantPermission.js"

export const copyFile = async (url, destinationUrl) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationUrl)

  await createParentDirectories(fileDestinationUrl)
  await copyFileContent(fileUrl, fileDestinationUrl)

  const fileStat = await readLStat(fileUrl)
  const filePermissions = binaryFlagsToPermissions(fileStat.mode)
  await writePermissions(fileDestinationUrl, filePermissions)
  await writeTimestamps(fileDestinationUrl, {
    atime: fileStat.atimeMs,
    mtime: fileStat.mtimeMs,
  })
}

const copyFileContent = async (fileUrl, fileDestinationUrl) => {
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  return copyFileContentNaive(filePath, fileDestinationPath, {
    onPermissionsDenied: async () => {
      const [readSourcePermission, writeDestinationPermission] = await Promise.all([
        testPermission(fileUrl, { read: true }),
        testPermission(fileDestinationUrl, { write: true }),
      ])

      let restoreSource = () => {}
      let restoreDestination = () => {}

      if (!readSourcePermission) {
        restoreSource = await grantPermission(fileUrl, { read: true })
      }
      if (!writeDestinationPermission) {
        restoreDestination = await grantPermission(fileDestinationUrl, { write: true })
      }

      try {
        await copyFileContentNaive(filePath, fileDestinationPath)
      } finally {
        await Promise.all([restoreSource(), restoreDestination()])
      }
    },
  })
}

const copyFileContentNaive = (
  filePath,
  fileDestinationPath,
  { onPermissionsDenied = null } = {},
) => {
  return new Promise((resolve, reject) => {
    copyFileNode(filePath, fileDestinationPath, async (error) => {
      if (error) {
        if (onPermissionsDenied && error.code === "EACCES") {
          resolve(onPermissionsDenied(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
