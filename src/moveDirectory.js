import { rename } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { removeDirectory } from "./removeDirectory.js"
import { removeFile } from "./removeFile.js"
import { copyDirectory } from "./copyDirectory.js"
import { readLStat } from "./readLStat.js"

export const moveDirectory = async (
  directoryUrl,
  directoryDestinationUrl,
  { overwrite = false } = {},
) => {
  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)

  const stat = await readLStat(directoryDestinationUrl, { nullIfNotFound: true })
  if (stat) {
    if (!overwrite) {
      throw new Error(
        `cannot move ${directoryUrl} at ${directoryDestinationUrl}, there is already a ${
          stat.isDirectory() ? "directory" : "file"
        }`,
      )
    }

    if (stat.isDirectory()) {
      await removeDirectory(directoryDestinationUrl, { removeContent: true })
    } else {
      await removeFile(directoryDestinationUrl.slice(-1))
    }
  } else {
    await createParentDirectories(directoryDestinationUrl)
  }

  await moveDirectoryNaive(directoryUrl, directoryDestinationUrl, {
    handleCrossDeviceError: async () => {
      await copyDirectory(directoryUrl, directoryDestinationUrl, { preserveStat: true })
      await removeDirectory(directoryUrl, { removeContent: true })
    },
  })
}

const moveDirectoryNaive = (
  directoryUrl,
  directoryDestinationUrl,
  { handleCrossDeviceError = null } = {},
) => {
  const directoryPath = urlToFileSystemPath(directoryUrl)
  const directoryDestinationPath = urlToFileSystemPath(directoryDestinationUrl)

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
