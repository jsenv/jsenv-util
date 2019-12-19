import { promisify } from "util"
import { writeFile } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFilePath } from "./urlToFilePath.js"
import { createFileDirectories } from "./createFileDirectories.js"

const writeFilePromisified = promisify(writeFile)
export const writeFileContent = async (value, content) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  const filePath = urlToFilePath(fileUrl)
  await createFileDirectories(filePath)
  return writeFilePromisified(filePath, content)
}
