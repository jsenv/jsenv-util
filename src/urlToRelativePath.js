import { relative, dirname } from "path"
import { urlToFilePath } from "./urlToFilePath.js"

export const urlToRelativePath = (fileUrl, baseFileUrl) => {
  // https://stackoverflow.com/a/31024574/2634179
  const fromPath = baseFileUrl.endsWith("/")
    ? urlToFilePath(baseFileUrl)
    : dirname(urlToFilePath(baseFileUrl))
  const toPath = urlToFilePath(fileUrl)
  const relativePath = relative(fromPath, toPath)

  return replaceBackSlashesWithSlashes(relativePath)
}

const replaceBackSlashesWithSlashes = (string) => string.replace(/\\/g, "/")
