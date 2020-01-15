import { watch, open, close } from "fs"

const isWindows = process.platform === "win32"

export const createWatcher = (sourcePath, options) => {
  const watcher = watch(sourcePath, options)

  if (isWindows) {
    watcher.on("error", async (error) => {
      // https://github.com/joyent/node/issues/4337
      if (error.code === "EPERM") {
        const err = await new Promise((resolve, reject) => {
          open(sourcePath, "r", (openError, fd) => {
            if (fd) {
              close(fd, (closeError) => {
                if (closeError) {
                  reject(error)
                } else {
                  resolve()
                }
              })
            } else {
              reject(error)
            }
          })
        })
        console.error(err)
      }
    })
  }

  return watcher
}
