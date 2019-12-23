import { stat } from "fs"
import { statsToType } from "./internal/statsToType.js"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const assertDirectoryExists = async (value) => {
  // .slice(0, -1) is to remove the trailing slash
  // otherwise node.js will throw ENOTDIR and the error message
  // will know it's not a directory but not what is here instead
  const directoryUrl = assertAndNormalizeDirectoryUrl(value).slice(0, -1)
  const directoryPath = urlToFileSystemPath(directoryUrl)
  const { NOT_FOUND, NOT_A_DIRECTORY, type } = await new Promise((resolve, reject) => {
    stat(directoryPath, (error, stats) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve({ NOT_FOUND: true })
        } else {
          reject(error)
        }
      } else if (stats.isDirectory()) {
        resolve({})
      } else {
        resolve({ NOT_A_DIRECTORY: true, type: statsToType(stats) })
      }
    })
  })

  if (NOT_FOUND) {
    throw new Error(`directory not found at ${directoryPath}`)
  }

  if (NOT_A_DIRECTORY) {
    throw new Error(`directory expected at ${directoryPath} and found ${type} instead`)
  }
}
