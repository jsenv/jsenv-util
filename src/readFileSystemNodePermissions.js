import { stat } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const readFileSystemNodePermissions = async (source) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  return new Promise((resolve, reject) => {
    stat(sourcePath, (error, stats) => {
      if (error) {
        reject(error)
      } else {
        resolve(binaryFlagsToPermissions(stats.mode))
      }
    })
  })
}
