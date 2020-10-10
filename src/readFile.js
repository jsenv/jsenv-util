import { promisify } from "util"
import { readFile as readFileNode } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const readFilePromisified = promisify(readFileNode)
export const readFile = async (value, { as = "string" } = {}) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const buffer = await readFilePromisified(filePath)
  if (as === "buffer") {
    return buffer
  }
  if (as === "string") {
    return buffer.toString()
  }
  if (as === "json") {
    return JSON.parse(buffer.toString())
  }
  throw new Error(`as must be one of buffer,string,json, received ${as}.`)
}
