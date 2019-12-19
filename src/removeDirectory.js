import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

const rimraf = import.meta.require("rimraf")

export const removeDirectory = (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFilePath(directoryUrl)

  return new Promise((resolve, reject) =>
    rimraf(directoryPath, (error) => {
      if (error) reject(error)
      else resolve()
    }),
  )
}
