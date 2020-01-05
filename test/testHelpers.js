// import { fork } from "child_process"
import { promises } from "fs"
import { removeFile, urlToFileSystemPath } from "../index.js"

const { open } = promises

// does not seems sufficient to trigger EBUSY error
// make the file content executable (and a code that does not exit) instead ?
export const makeBusyFile = async (fileUrl, callback) => {
  // await writeFile(fileUrl)
  const filePath = urlToFileSystemPath(fileUrl)
  const filehandle = await open(filePath, "a")
  try {
    await callback()
  } finally {
    await filehandle.close()
    await removeFile(filePath)
  }
}
