import { copyFile as copyFileNode } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeParentDirectories } from "./writeParentDirectories.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { writeFileSystemNodePermissions } from "./writeFileSystemNodePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"

// hum copyFile doit changer pour tenir compte des liens symboliques
// en gros on copie un lien symbolique avec la logique de copyDirectory
// et on va tester ça dans copyFile et pas dans copyDirectory

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

  const sourceStat = await readFileSystemNodeStat(fileUrl, { nullIfNotFound: true })
  if (!sourceStat) {
    throw new Error(`copyFile must be called on a file, nothing found at ${filePath}`)
  }
  if (sourceStat.isDirectory()) {
    throw new Error(`copyFile must be called on a file, found directory at ${filePath}`)
  }

  const destinationStat = await readFileSystemNodeStat(fileDestinationUrl, { nullIfNotFound: true })
  if (destinationStat) {
    if (destinationStat.isDirectory()) {
      throw new Error(
        `cannot copy ${filePath} at ${fileDestinationPath} because destination is a directory`,
      )
    }
    if (overwrite) {
      await removeFileSystemNode(fileDestinationUrl)
    } else {
      throw new Error(
        `cannot copy ${filePath} at ${fileDestinationPath} because there is already a file and overwrite option is disabled`,
      )
    }
  } else {
    await writeParentDirectories(fileDestinationUrl)
  }

  await copyFileContentNaive(filePath, fileDestinationPath)

  if (preservePermissions || preserveMtime || preserveAtime) {
    if (!fileStat) {
      fileStat = await readFileSystemNodeStat(fileUrl)
    }

    const { mode, atimeMs, mtimeMs } = fileStat
    if (preserveMtime || preserveAtime) {
      await writeTimestamps(fileDestinationUrl, {
        ...(preserveMtime ? { mtime: mtimeMs } : {}),
        ...(preserveAtime ? { atime: atimeMs } : {}),
      })
    }
    if (preservePermissions) {
      await writeFileSystemNodePermissions(fileDestinationUrl, binaryFlagsToPermissions(mode))
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
