import { rename } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { copyFile } from "./copyFile.js"
import { removeFile } from "./removeFile.js"
import { directoryExists } from "./directoryExists.js"
import { readLStat } from "./readLStat.js"

export const moveFile = async (value, destinationValue, { overwrite = false } = {}) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationValue)

  const filePath = urlToFileSystemPath(fileUrl)
  const fileDestinationPath = urlToFileSystemPath(fileDestinationUrl)

  if (await directoryExists(filePath)) {
    throw new Error(`moveFile must be called on a file, found directory at ${filePath}`)
  }

  const destinationStat = await readLStat(fileDestinationPath, { nullIfNotFound: true })
  if (destinationStat) {
    if (destinationStat.isDirectory()) {
      throw new Error(
        `cannot move ${filePath} at ${fileDestinationPath} because destination is a directory`,
      )
    }

    if (overwrite) {
      await removeFile(fileDestinationUrl)
    } else {
      throw new Error(
        `cannot move ${filePath} at ${fileDestinationPath} because destination file exists and overwrite option is disabled`,
      )
    }
  } else {
    await createParentDirectories(fileDestinationUrl)
  }

  return moveFileNaive(filePath, fileDestinationPath, {
    handleCrossDeviceError: async () => {
      await copyFile(filePath, fileDestinationPath, { preserveStat: true })
      await removeFile(filePath)
    },
  })
}

const moveFileNaive = (filePath, fileDestinationPath, { handleCrossDeviceError = null } = {}) => {
  return new Promise((resolve, reject) => {
    rename(filePath, fileDestinationPath, (error) => {
      if (error) {
        if (handleCrossDeviceError && error.code === "EXDEV") {
          resolve(handleCrossDeviceError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
