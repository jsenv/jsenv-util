import { dirname } from "path"
import { promises } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const { mkdir } = promises

export const writeParentDirectories = async (destination, { allowUseless = false } = {}) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination)
  const destinationPath = urlToFileSystemPath(destinationUrl)
  const destinationParentPath = dirname(destinationPath)

  try {
    await mkdir(destinationParentPath, { recursive: true })
  } catch (error) {
    if (allowUseless && error && error.code === "EEXIST") {
      return
    }
    throw error
  }
}
