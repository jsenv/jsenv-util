// import { fork } from "child_process"
import { promises } from "fs"
import { removeFileSystemNode, urlToFileSystemPath, readFileSystemNodeStat } from "../index.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_class_filehandle
const { open } = promises

// does not seems sufficient to trigger EBUSY error
// make the file content executable (and a code that does not exit) instead ?
export const makeBusyFile = async (fileUrl, callback) => {
  // await writeFile(fileUrl)
  const filePath = urlToFileSystemPath(fileUrl)
  const filehandle = await open(filePath, "a")
  filehandle.write("whatever")
  try {
    await callback()
  } finally {
    await filehandle.close()
    await removeFileSystemNode(fileUrl, { allowUseless: true })
  }
}

export const testDirectoryPresence = async (source) => {
  const stats = await readFileSystemNodeStat(source, { nullIfNotFound: true })
  return Boolean(stats && stats.isDirectory())
}

export const testFilePresence = async (source) => {
  const stats = await readFileSystemNodeStat(source, { nullIfNotFound: true })
  return Boolean(stats && stats.isFile())
}

export const testSymbolicLinkPresence = async (source) => {
  const stats = await readFileSystemNodeStat(source, {
    nullIfNotFound: true,
    followLink: false,
  })
  return Boolean(stats && stats.isSymbolicLink())
}
