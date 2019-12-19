import { stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

export const assertFileExists = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  const filesystemEntry = await pathToFilesystemEntry(filePath)

  if (!filesystemEntry) {
    throw new Error(`file not found at ${filePath}`)
  }

  const { type } = filesystemEntry
  if (type !== "file") {
    throw new Error(`file expected at ${filePath} but found ${type}`)
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
