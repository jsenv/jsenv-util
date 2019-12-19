import { dirname } from "path"
import { mkdir } from "fs"

export const createFileDirectories = (filePath) => {
  return new Promise((resolve, reject) => {
    mkdir(dirname(filePath), { recursive: true }, (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve()
          return
        }
        reject(error)
        return
      }
      resolve()
    })
  })
}
