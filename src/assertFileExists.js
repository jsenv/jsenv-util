import { stat } from "fs"
import { statsToType } from "./internal/statsToType.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

export const assertFileExists = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  const { NOT_FOUND, NOT_A_FILE, type } = await new Promise((resolve, reject) => {
    stat(filePath, (error, stats) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve({ NOT_FOUND: true })
        } else {
          reject(error)
        }
      } else if (stats.isFile()) {
        resolve({})
      } else {
        resolve({ NOT_A_FILE: true, type: statsToType(stats) })
      }
    })
  })

  if (NOT_FOUND) {
    throw new Error(`file not found at ${filePath}`)
  }

  if (NOT_A_FILE) {
    throw new Error(`file expected at ${filePath} and found ${type} instead`)
  }
}
