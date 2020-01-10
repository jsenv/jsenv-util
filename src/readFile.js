import { promisify } from "util"
import { readFile as readFileNode } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const readFilePromisified = promisify(readFileNode)
export const readFile = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const buffer = await readFilePromisified(filePath)
  return buffer.toString()
}
