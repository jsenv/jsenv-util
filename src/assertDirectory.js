import { statsToType } from "./internal/statsToType.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const assertDirectory = async (source) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
  })
  if (!sourceStats) {
    throw new Error(`directory not found at ${sourcePath}`)
  }
  if (!sourceStats.isDirectory()) {
    throw new Error(
      `directory expected at ${sourcePath} and found ${statsToType(sourceStats)} instead`,
    )
  }
}
