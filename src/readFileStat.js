import { promisify } from "util"
import { stat } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"

const statPromisified = promisify(stat)
export const readFileStat = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  const statsObject = await statPromisified(filePath)
  return statsObject
}
