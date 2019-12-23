import { utimes } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeFileModificationDate = (value, date) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)

  return new Promise((resolve, reject) => {
    utimes(filePath, date, date, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
