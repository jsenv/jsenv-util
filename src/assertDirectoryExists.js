import { stat } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

export const assertDirectoryExists = async (value) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value)
  const directoryPath = urlToFilePath(directoryUrl)
  const filesystemEntry = await pathToFilesystemEntry(directoryPath)

  if (!filesystemEntry) {
    throw new Error(`directory not found at ${directoryPath}`)
  }

  const { type } = filesystemEntry
  if (type !== "folder") {
    throw new Error(`directory expected at ${directoryPath} but found ${type}`)
  }
}

const pathToFilesystemEntry = (path) =>
  new Promise((resolve, reject) => {
    stat(path, (error, stats) => {
      if (error) {
        if (error.code === "ENOENT") resolve(null)
        else reject(error)
      } else {
        resolve({
          // eslint-disable-next-line no-nested-ternary
          type: stats.isFile() ? "file" : stats.isDirectory() ? "folder" : "other",
          stats,
        })
      }
    })
  })
