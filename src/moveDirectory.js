import { rename } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { removeDirectory } from "./removeDirectory.js"
import { copyDirectory } from "./copyDirectory.js"
import { readLStat } from "./readLStat.js"

export const moveDirectory = async (
  directoryUrl,
  directoryDestinationUrl,
  { overwrite = false } = {},
) => {
  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)
  const directoryPath = urlToFileSystemPath(directoryUrl)
  const directoryDestinationPath = urlToFileSystemPath(directoryDestinationUrl)

  const sourceStat = await readLStat(directoryUrl, { nullIfNotFound: true })
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

  const destinationStat = await readLStat(directoryDestinationUrl, { nullIfNotFound: true })
  if (destinationStat) {
    if (!destinationStat.isDirectory()) {
      throw new Error(
        `cannot move ${directoryPath} at ${directoryDestinationPath} because destination is not a directory`,
      )
    }

    if (overwrite) {
      await removeDirectory(directoryDestinationUrl, { removeContent: true })
    } else {
      throw new Error(
        `cannot move ${directoryPath} at ${directoryDestinationPath} because there is already a directory and overwrite option is disabled`,
      )
    }
  } else {
    await createParentDirectories(directoryDestinationUrl)
  }

  await moveDirectoryNaive(directoryPath, directoryDestinationPath, {
    handleCrossDeviceError: async () => {
      await copyDirectory(directoryUrl, directoryDestinationUrl, { preserveStat: true })
      await removeDirectory(directoryUrl, { removeContent: true })
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
