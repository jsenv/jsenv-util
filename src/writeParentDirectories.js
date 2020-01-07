import { dirname } from "path"
import { promises } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const { mkdir } = promises

export const writeParentDirectories = async (destination, { uselessError = false } = {}) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination)
  const destinationPath = urlToFileSystemPath(destinationUrl)
  const destinationParentPath = dirname(destinationPath)

  try {
    await mkdir(destinationParentPath, { recursive: true })
  } catch (error) {
    if (uselessError === false && error && error.code === "EEXIST") {
      return
    }
    throw error
  }
}
