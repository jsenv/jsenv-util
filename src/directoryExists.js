import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readLStat } from "./readLStat.js"

export const directoryExists = async (url) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)

  try {
    const stat = await readLStat(directoryUrl)
    return stat.isDirectory()
  } catch (e) {
    if (e.code === "ENOENT") {
      return false
    }
    throw e
  }
}
