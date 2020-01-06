import { copyFile as copyFileNode } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { removeFile } from "./removeFile.js"

export const copyFile = async (
  url,
  destinationUrl,
  {
    overwrite = false,
    preserveStat = true,
    preserveMtime = preserveStat,
    preserveAtime = preserveStat,
    preservePermissions = preserveStat,
    fileStat,
  } = {},
) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationUrl)
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  const sourceStat = await readLStat(fileUrl, { nullIfNotFound: true })
  if (!sourceStat) {
    throw new Error(`copyFile must be called on a file, nothing found at ${filePath}`)
  }
  if (sourceStat.isDirectory()) {
    throw new Error(`copyFile must be called on a file, found directory at ${filePath}`)
  }

  const destinationStat = await readLStat(fileDestinationUrl, { nullIfNotFound: true })
  if (destinationStat) {
    if (destinationStat.isDirectory()) {
      throw new Error(
        `cannot copy ${filePath} at ${fileDestinationPath} because destination is a directory`,
      )
    }
    if (overwrite) {
      await removeFile(fileDestinationUrl)
    } else {
      throw new Error(
        `cannot copy ${filePath} at ${fileDestinationPath} because there is already a file and overwrite option is disabled`,
      )
    }
  } else {
    await createParentDirectories(fileDestinationUrl)
  }

  await copyFileContentNaive(filePath, fileDestinationPath)

  if (preservePermissions || preserveMtime || preserveAtime) {
    if (!fileStat) {
      fileStat = await readLStat(fileUrl)
    }

    const { mode, atimeMs, mtimeMs } = fileStat
    if (preserveMtime || preserveAtime) {
      await writeTimestamps(fileDestinationUrl, {
        ...(preserveMtime ? { mtime: mtimeMs } : {}),
        ...(preserveAtime ? { atime: atimeMs } : {}),
      })
    }
    if (preservePermissions) {
      await writePermissions(fileDestinationUrl, binaryFlagsToPermissions(mode))
    }
  }
}

const copyFileContentNaive = (filePath, fileDestinationPath) => {
  return new Promise((resolve, reject) => {
    copyFileNode(filePath, fileDestinationPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
