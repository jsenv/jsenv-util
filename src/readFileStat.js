import { promisify } from "util"
import { stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const statPromisified = promisify(stat)
export const readFileStat = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFileSystemPath(fileUrl)
  const statsObject = await statPromisified(filePath)
  return statsObject
}
