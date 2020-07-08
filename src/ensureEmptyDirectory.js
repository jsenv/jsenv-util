import { statsToType } from "./internal/statsToType.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeDirectory } from "./writeDirectory.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"

export const ensureEmptyDirectory = async (source) => {
  const stats = await readFileSystemNodeStat(source, { nullIfNotFound: true, followLink: false })
  if (stats === null) {
    // if there is nothing, create a directory
    return writeDirectory(source, { allowUseless: true })
  }
  if (stats.isDirectory()) {
    // if there is a directory remove its content and done
    return removeFileSystemNode(source, {
      allowUseless: true,
      recursive: true,
      onlyContent: true,
    })
  }

  const sourceType = statsToType(stats)
  const sourcePath = urlToFileSystemPath(assertAndNormalizeFileUrl(source))
  throw new Error(
    `ensureEmptyDirectory expect directory at ${sourcePath}, found ${sourceType} instead`,
  )
}
