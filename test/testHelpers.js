import { fork } from "child_process"
import { writeFile, urlToFileSystemPath } from "../index.js"

export const makeBusyFile = async (fileUrl, callback) => {
  await writeFile(fileUrl, `setInterval(() => {}, 100)`)
  const child = fork(urlToFileSystemPath(fileUrl), {
    // to avoid debugging that child
    execArgv: [],
  })
  try {
    await callback()
  } finally {
    await new Promise((resolve) => {
      child.on("close", resolve)
      child.kill()
    })
  }
}
