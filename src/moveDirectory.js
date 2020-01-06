import { rename } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeParentDirectories } from "./writeParentDirectories.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { copyDirectory } from "./copyDirectory.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const moveDirectory = async (
  directoryUrl,
  directoryDestinationUrl,
  { overwrite = false } = {},
) => {
  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)
  const directoryPath = urlToFileSystemPath(directoryUrl)
  const directoryDestinationPath = urlToFileSystemPath(directoryDestinationUrl)

  const sourceStat = await readFileSystemNodeStat(directoryUrl, { nullIfNotFound: true })
  if (!sourceStat) {
    throw new Error(
      `moveDirectory must be called on a directory, nothing found at ${directoryPath}`,
    )
  }
  if (!sourceStat.isDirectory()) {
    throw new Error(
      `moveDirectory must be called on a directory, found file at ${directoryPath.slice(0, -1)}`,
    )
  }

  const destinationStat = await readFileSystemNodeStat(directoryDestinationUrl, {
    nullIfNotFound: true,
  })
  if (destinationStat) {
    if (!destinationStat.isDirectory()) {
      throw new Error(
        `cannot move ${directoryPath} at ${directoryDestinationPath} because destination is not a directory`,
      )
    }

    if (overwrite) {
      await removeFileSystemNode(directoryDestinationUrl, { recursive: true })
    } else {
      throw new Error(
        `cannot move ${directoryPath} at ${directoryDestinationPath} because there is already a directory and overwrite option is disabled`,
      )
    }
  } else {
    await writeParentDirectories(directoryDestinationUrl)
  }

  await moveDirectoryNaive(directoryPath, directoryDestinationPath, {
    handleCrossDeviceError: async () => {
      await copyDirectory(directoryUrl, directoryDestinationUrl, { preserveStat: true })
      await removeFileSystemNode(directoryUrl, { recursive: true })
    },
  })
}

const moveDirectoryNaive = (
  directoryPath,
  directoryDestinationPath,
  { handleCrossDeviceError = null } = {},
) => {
  return new Promise((resolve, reject) => {
    rename(directoryPath, directoryDestinationPath, (error) => {
      if (error) {
        if (handleCrossDeviceError && error.code === "EXDEV") {
          resolve(handleCrossDeviceError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
