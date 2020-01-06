import { copyFile as copyFileNode } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { removeDirectory } from "./removeDirectory.js"
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

  const stat = await readLStat(fileDestinationUrl, { nullIfNotFound: true })
  if (stat) {
    if (!overwrite) {
      throw new Error(
        `cannot copy ${fileUrl} at ${fileDestinationUrl}, there is already a ${
          stat.isDirectory() ? "directory" : "file"
        }`,
      )
    }

    if (stat.isDirectory()) {
      await removeDirectory(fileDestinationUrl, { removeContent: true })
    } else {
      await removeFile(fileDestinationUrl)
    }
  }

  await createParentDirectories(fileDestinationUrl)
  await copyFileContent(fileUrl, fileDestinationUrl)

  if (preservePermissions || preserveMtime || preserveAtime) {
    if (!fileStat) {
      fileStat = await readLStat(fileUrl)
    }

    const { mode, atimeMs, mtimeMs } = fileStat
    if (preservePermissions) {
      await writePermissions(fileDestinationUrl, binaryFlagsToPermissions(mode))
    }
    if (preserveMtime || preserveAtime) {
      // do this in the end and not in parallel otherwise atime could be affected by
      // writePermissions
      await writeTimestamps(fileDestinationUrl, {
        ...(preserveMtime ? { mtime: mtimeMs } : {}),
        ...(preserveAtime ? { atime: atimeMs } : {}),
      })
    }
  }
}

const copyFileContent = async (fileUrl, fileDestinationUrl) => {
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  return copyFileContentNaive(filePath, fileDestinationPath)
}

const copyFileContentNaive = (filePath, fileDestinationPath) => {
  return new Promise((resolve, reject) => {
    copyFileNode(filePath, fileDestinationPath, async (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
