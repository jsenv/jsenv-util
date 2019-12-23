import { promisify } from "util"
import { readFile } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const readFilePromisified = promisify(readFile)
export const readFileContent = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const buffer = await readFilePromisified(filePath)
  return buffer.toString()
}
