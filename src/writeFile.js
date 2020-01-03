import { promisify } from "util"
import { writeFile as writeFileNode } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { createParentDirectories } from "./createParentDirectories.js"

const writeFilePromisified = promisify(writeFileNode)
export const writeFile = async (value, content) => {
  const fileUrl = assertAndNormalizeFileUrl(value)
  await createParentDirectories(fileUrl)

  const filePath = urlToFileSystemPath(fileUrl)
  return writeFilePromisified(filePath, content)
}
