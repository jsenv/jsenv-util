import { rename } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"

export const moveFile = async (
  value,
  destinationValue,
  { autoGrantRequiredPermissions = true } = {},
) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationValue)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  await createParentDirectories(fileDestinationUrl)
  // TODO: handle permission denied to write source file and/or to write destination file
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
