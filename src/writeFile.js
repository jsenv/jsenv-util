import { promisify } from "util"
import { writeFile as writeFileNode } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeParentDirectories } from "./writeParentDirectories.js"

const writeFilePromisified = promisify(writeFileNode)
export const writeFile = async (value, content) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  await writeParentDirectories(fileUrl)

  const filePath = urlToFileSystemPath(fileUrl)
  return writeFilePromisified(filePath, content)
}
