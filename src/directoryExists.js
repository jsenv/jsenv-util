import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readLStat } from "./readLStat.js"

export const directoryExists = async (url) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)

  const stat = await readLStat(directoryUrl, { nullIfNotFound: true })
  return Boolean(stat && stat.isDirectory())
}
