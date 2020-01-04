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

export const copyFile = async (url, destinationUrl, fileStat) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationUrl)

  await createParentDirectories(fileDestinationUrl)
  await copyFileContent(fileUrl, fileDestinationUrl)

  if (!fileStat) {
    fileStat = await readLStat(fileUrl)
  }

  const { mode, atimeMs, mtimeMs } = fileStat
  await writePermissions(fileDestinationUrl, binaryFlagsToPermissions(mode))
  // do this in the end and not in parallel otherwise atime could be affected by
  // writePermissions
  await writeTimestamps(fileDestinationUrl, {
    atime: atimeMs,
    mtime: mtimeMs,
  })
}

const copyFileContent = async (fileUrl, fileDestinationUrl) => {
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  return copyFileContentNaive(filePath, fileDestinationPath, {
    handlePermissionError: async () => {
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
  { handlePermissionError = null } = {},
) => {
  return new Promise((resolve, reject) => {
    copyFileNode(filePath, fileDestinationPath, async (error) => {
      if (error) {
        if (handlePermissionError && error.code === "EACCES") {
          resolve(handlePermissionError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
