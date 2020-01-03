import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { copyFileContent } from "./copyFileContent.js"

export const copyFile = async (url, destinationUrl) => {
  const fileUrl = assertAndNormalizeFileUrl(url)
  const fileDestinationUrl = assertAndNormalizeFileUrl(destinationUrl)

  await copyFileContent(fileUrl, fileDestinationUrl)
  const statObject = await readLStat(fileUrl)
  await writePermissions(fileDestinationUrl, statObject.mode)
  await writeTimestamps(fileDestinationUrl, {
    atime: statObject.atimeMs,
    mtime: statObject.mtimeMs,
  })
}
