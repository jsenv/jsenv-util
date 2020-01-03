import { copyFile } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"

export const copyFileContent = async (url, destinationUrl) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationUrl)

  await createParentDirectories(fileDestinationUrl)

  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)
  return new Promise((resolve, reject) => {
    copyFile(filePath, fileDestinationPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
