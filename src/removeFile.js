import { unlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const removeFile = (url) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const filePath = urlToFileSystemPath(fileUrl)

  return removeFileNaive(filePath)
}

const removeFileNaive = (filePath) => {
  return new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
