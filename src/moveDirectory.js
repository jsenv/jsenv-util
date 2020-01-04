import { rename } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { removeDirectory } from "./removeDirectory.js"
import { fileExists } from "./fileExists.js"
import { removeFile } from "./removeFile.js"
import { directoryExists } from "./directoryExists.js"
import { copyDirectory } from "./copyDirectory.js"

export const moveDirectory = async (
  directoryUrl,
  directoryDestinationUrl,
  { autoGrantRequiredPermissions = true } = {},
) => {
  directoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)

  if (await directoryExists(directoryDestinationUrl)) {
    await removeDirectory(directoryDestinationUrl, { autoGrantRequiredPermissions })
  } else {
    await createParentDirectories(directoryDestinationUrl)
  }

  if (await fileExists(directoryDestinationUrl)) {
    await removeFile(directoryDestinationUrl, { autoGrantRequiredPermissions })
  }

  await moveDirectoryNaive(directoryUrl, directoryDestinationUrl, {
    handleCrossDeviceError: async () => {
      await copyDirectory(directoryUrl, directoryDestinationUrl, { autoGrantRequiredPermissions })
      await removeDirectory(directoryUrl, { autoGrantRequiredPermissions })
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
