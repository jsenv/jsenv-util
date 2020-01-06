import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const directoryExists = async (url) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)
  const fileSystemUrl = directoryUrl.slice(0, -1)

  const stat = await readFileSystemNodeStat(fileSystemUrl, { nullIfNotFound: true })
  return Boolean(stat && stat.isDirectory())
}
