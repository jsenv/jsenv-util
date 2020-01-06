import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readStat } from "./readStat.js"

export const directoryExists = async (url) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)
  const fileSystemUrl = directoryUrl.slice(0, -1)

  const stat = await readStat(fileSystemUrl, { nullIfNotFound: true })
  return Boolean(stat && stat.isDirectory())
}
