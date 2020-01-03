import { stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

// Do not factorize with readFileStat because of
// the error.code === 'ENOENT' shortcut that avoids
// throwing any error
export const fileExists = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)

  return new Promise((resolve, reject) => {
    stat(filePath, (error, stats) => {
      if (error) {
        if (error.code === "ENOENT") resolve(false)
        else reject(error)
      } else {
        resolve(stats.isFile())
      }
    })
  })
}
