import { utimes } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeFileModificationTime = (value, time) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const timeValue = typeof time === "number" ? new Date(time) : time

  return new Promise((resolve, reject) => {
    utimes(filePath, timeValue, timeValue, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
