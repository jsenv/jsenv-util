import { promisify } from "util"
import { readFile } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

const readFilePromisified = promisify(readFile)
export const readFileContent = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  const buffer = await readFilePromisified(filePath)
  return buffer.toString()
}
