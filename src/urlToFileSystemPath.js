import { fileURLToPath } from "url"

export const urlToFileSystemPath = (fileUrl) => {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1)
  }
  const fileSystemPath = fileURLToPath(fileUrl)
  return fileSystemPath
}
