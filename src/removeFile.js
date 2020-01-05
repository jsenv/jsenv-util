import { unlink } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const removeFile = (url, { busyMaxAttempt = 3, busyInterval = 100 } = {}) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const filePath = urlToFileSystemPath(fileUrl)
  let busyAttemptCount = 0

  const attempt = () => {
    return removeFileNaive(filePath, {
      ...(busyAttemptCount === busyMaxAttempt
        ? {}
        : {
            handleBusyError: async () => {
              busyAttemptCount++
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(attempt())
                }, busyAttemptCount * busyInterval)
              })
            },
          }),
    })
  }

  return attempt()
}

const removeFileNaive = (filePath, { handleBusyError = null } = {}) => {
  return new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else if (handleBusyError && (error.code === "EBUSY" || error.code === "EPERM")) {
          resolve(handleBusyError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
