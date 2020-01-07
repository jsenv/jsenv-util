import { rename } from "fs"
import { statsToType } from "./internal/statsToType.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { ensureUrlTrailingSlash } from "./ensureUrlTrailingSlash.js"
import { writeParentDirectories } from "./writeParentDirectories.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { copyFileSystemNode } from "./copyFileSystemNode.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const moveFileSystemNode = async (
  source,
  destination,
  { overwrite = false, allowUseless = false } = {},
) => {
  let sourceUrl = assertAndNormalizeFileUrl(source)
  let destinationUrl = assertAndNormalizeFileUrl(destination)
  const sourcePath = urlToFileSystemPath(sourceUrl)
  const destinationPath = urlToFileSystemPath(destinationUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followSymbolicLink: false,
  })
  if (!sourceStats) {
    throw new Error(`nothing to move from ${sourcePath}`)
  }
  if (sourceStats.isDirectory()) {
    sourceUrl = ensureUrlTrailingSlash(sourceUrl)
    destinationUrl = ensureUrlTrailingSlash(destinationUrl)
  }
  if (sourceUrl === destinationUrl) {
    if (allowUseless) {
      return
    }
    throw new Error(`no move needed for ${sourcePath} because destination and source are the same`)
  }

  const destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    followSymbolicLink: false,
  })
  if (destinationStats) {
    const sourceType = statsToType(sourceStats)

    const destinationType = statsToType(destinationStats)

    if (sourceType !== destinationType) {
      throw new Error(
        `cannot move ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and is not a ${sourceType} (it's a ${destinationType})`,
      )
    }
    if (!overwrite) {
      throw new Error(
        `cannot move ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and overwrite option is disabled`,
      )
    }

    // remove file, link, directory...
    await removeFileSystemNode(destinationUrl, { recursive: true })
  } else {
    await writeParentDirectories(destinationUrl)
  }

  await moveNaive(sourcePath, destinationPath, {
    handleCrossDeviceError: async () => {
      await copyFileSystemNode(sourceUrl, destinationUrl, { preserveStat: true })
      await removeFileSystemNode(sourceUrl, { recursive: true })
    },
  })
}

const moveNaive = (sourcePath, destinationPath, { handleCrossDeviceError = null } = {}) => {
  return new Promise((resolve, reject) => {
    rename(sourcePath, destinationPath, (error) => {
      if (error) {
        if (handleCrossDeviceError && error.code === "EXDEV") {
          resolve(handleCrossDeviceError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}
