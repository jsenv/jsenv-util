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
  const directoryPath = urlToFileSystemPath(directoryUrl)
  directoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)
  const directoryDestinationPath = urlToFileSystemPath(directoryDestinationUrl)

  if (await directoryExists(directoryDestinationUrl)) {
    await removeDirectory(directoryDestinationUrl)
  } else {
    await createParentDirectories(directoryDestinationUrl)
  }

  if (await fileExists(directoryDestinationUrl)) {
    await removeFile(directoryDestinationUrl)
  }

  return new Promise((resolve, reject) => {
    rename(directoryPath, directoryDestinationPath, async (error) => {
      if (error) {
        if (error.code === "EXDEV") {
          try {
            await copyDirectory(directoryUrl, directoryDestinationUrl)
            await removeDirectory(directoryUrl)
            resolve()
          } catch (e) {
            reject(e)
          }
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
