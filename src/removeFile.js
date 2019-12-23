import { unlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const removeFile = (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  return new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
