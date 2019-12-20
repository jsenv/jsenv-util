import { rename } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"
import { createFileDirectories } from "./createFileDirectories.js"

export const moveFile = async (value, destinationValue) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  const destinationFileUrl = assertAndNormalizeFileUrl(destinationValue)
  const destinationFilePath = assertAndNormalizeFileUrl(destinationFileUrl)

  await createFileDirectories(destinationFileUrl)
  return new Promise((resolve, reject) => {
    rename(filePath, destinationFilePath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
