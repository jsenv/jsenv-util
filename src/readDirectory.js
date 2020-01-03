import { readdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const readDirectory = async (url) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)
  const directoryPath = urlToFileSystemPath(directoryUrl)

  return new Promise((resolve, reject) => {
    readdir(directoryPath, (error, names) => {
      if (error) {
        reject(error)
      } else {
        resolve(names)
      }
    })
  })
}
