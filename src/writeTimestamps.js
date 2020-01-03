import { utimes } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const writeTimestamps = (value, { mtime, atime = mtime }) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(value)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)
  const atimeValue = typeof atime === "number" ? new Date(atime) : atime
  const mtimeValue = typeof mtime === "number" ? new Date(mtime) : mtime

  return new Promise((resolve, reject) => {
    utimes(fileSystemPath, atimeValue, mtimeValue, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
