import { rename } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { removeDirectory } from "./removeDirectory.js"
import { fileExists } from "./fileExists.js"
import { removeFile } from "./removeFile.js"
import { directoryExists } from "./directoryExists.js"
import { copyDirectory } from "./copyDirectory.js"

export const moveDirectory = async (directoryUrl, directoryDestinationUrl) => {
  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)

  if (await directoryExists(directoryDestinationUrl)) {
    // TODO: handle permission denied to write destination directory (to remove it)
    await removeDirectory(directoryDestinationUrl)
  } else {
    await createParentDirectories(directoryDestinationUrl)
  }

  if (await fileExists(directoryDestinationUrl)) {
    // TODO: handle permission denied to write destination file (to remove it)
    await removeFile(directoryDestinationUrl)
  }

  await moveDirectoryNaive(directoryUrl, directoryDestinationUrl, {
    handleCrossDeviceError: async () => {
      await copyDirectory(directoryUrl, directoryDestinationUrl)
      // TODO: handle permission denied to write source directory (to remove it)
      await removeDirectory(directoryUrl)
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
