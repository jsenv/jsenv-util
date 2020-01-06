// hum en vrai ce serais mieux d'avoir juste move
// et on stat dessus et en fonction on fait des choses différente

import { rename } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeParentDirectories } from "./writeParentDirectories.js"
import { copyFile } from "./copyFile.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const moveFile = async (source, destination, { overwrite = false } = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  const destinationUrl = assertAndNormalizeFileUrl(destination)

  const sourcePath = urlToFileSystemPath(sourceUrl)
  const sourceStat = await readFileSystemNodeStat(sourceUrl, { nullIfNotFound: true })
  if (!sourceStat) {
    throw new Error(`moveFile must be called on a file, found nothing at ${sourcePath}`)
  }
  if (sourceStat.isDirectory()) {
    throw new Error(`moveFile must be called on a file, found directory at ${sourcePath}`)
  }

  const destinationPath = urlToFileSystemPath(destinationUrl)
  const destinationStat = await readFileSystemNodeStat(destinationPath, { nullIfNotFound: true })
  if (destinationStat) {
    if (destinationStat.isDirectory()) {
      throw new Error(
        `cannot move ${sourcePath} at ${destinationPath} because destination is a directory`,
      )
    }

    if (overwrite) {
      await removeFileSystemNode(destinationUrl)
    } else {
      throw new Error(
        `cannot move ${sourcePath} at ${destinationPath} because destination file exists and overwrite option is disabled`,
      )
    }
  } else {
    await writeParentDirectories(destinationUrl)
  }

  return moveFileNaive(sourcePath, destinationPath, {
    handleCrossDeviceError: async () => {
      await copyFile(sourceUrl, destinationUrl, { preserveStat: true })
      await removeFileSystemNode(sourceUrl)
    },
  })
}

const moveFileNaive = (sourcePath, destinationPath, { handleCrossDeviceError = null } = {}) => {
  return new Promise((resolve, reject) => {
    rename(sourcePath, destinationPath, (error) => {
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
