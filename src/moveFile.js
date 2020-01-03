import { rename } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createFileDirectories } from "./createFileDirectories.js"

export const moveFile = async (value, destinationValue) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationValue)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  await createFileDirectories(fileDestinationUrl)
  return new Promise((resolve, reject) => {
    rename(filePath, fileDestinationPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
