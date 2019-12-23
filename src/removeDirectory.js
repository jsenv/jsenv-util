import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const rimraf = import.meta.require("rimraf")

export const removeDirectory = (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return new Promise((resolve, reject) =>
    rimraf(directoryPath, (error) => {
      if (error) reject(error)
      else resolve()
    }),
  )
}
