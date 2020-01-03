import { stat } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const directoryExists = async (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return new Promise((resolve, reject) => {
    stat(directoryPath, (error, stats) => {
      if (error) {
        if (error.code === "ENOENT") resolve(false)
        else reject(error)
      } else {
        resolve(stats.isDirectory())
      }
    })
  })
}
