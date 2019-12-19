import { unlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

export const removeFile = (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
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
