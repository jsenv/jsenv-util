import { chmod } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writePermissions = async (url, permissions) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  return new Promise((resolve, reject) => {
    chmod(fileSystemPath, permissions, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
