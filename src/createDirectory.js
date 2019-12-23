import { mkdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

export const createDirectory = (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFilePath(directoryUrl)

  return new Promise((resolve, reject) => {
    mkdir(directoryPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}