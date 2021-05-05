import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { readSymbolicLink } from "./readSymbolicLink.js"
import { resolveUrl } from "./resolveUrl.js"
import { readDirectory } from "./readDirectory.js"
import { moveFileSystemNode } from "./moveFileSystemNode.js"

import { urlTargetsSameFileSystemPath } from "./internal/urlTargetsSameFileSystemPath.js"
import { statsToType } from "./internal/statsToType.js"

export const moveDirectoryContent = async (
  source,
  destination,
  { overwrite, followLink = true } = {},
) => {
  const sourceUrl = assertAndNormalizeDirectoryUrl(source)
  let destinationUrl = assertAndNormalizeDirectoryUrl(destination)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followLink: false,
  })
  if (!sourceStats) {
    throw new Error(`no directory to move content from at ${sourcePath}`)
  }
  if (!sourceStats.isDirectory()) {
    const sourceType = statsToType(sourceStats)
    throw new Error(`found a ${sourceType} instead of a directory at ${sourcePath}`)
  }

  let destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    // we force false here but in fact we will follow the destination link
    // to know where we will actually move and detect useless move overrite etc..
    followLink: false,
  })
  if (followLink && destinationStats && destinationStats.isSymbolicLink()) {
    const target = await readSymbolicLink(destinationUrl)
    destinationUrl = resolveUrl(target, destinationUrl)
    destinationStats = await readFileSystemNodeStat(destinationUrl, { nullIfNotFound: true })
  }
  const destinationPath = urlToFileSystemPath(destinationUrl)
  if (destinationStats === null) {
    throw new Error(`no directory to move content into at ${destinationPath}`)
  }
  if (!destinationStats.isDirectory()) {
    const destinationType = statsToType(destinationStats)
    throw new Error(
      `destination leads to a ${destinationType} instead of a directory at ${destinationPath}`,
    )
  }

  if (urlTargetsSameFileSystemPath(sourceUrl, destinationUrl)) {
    throw new Error(
      `cannot move directory content, source and destination are the same (${sourcePath})`,
    )
  }

  const directoryEntries = await readDirectory(sourceUrl)
  await Promise.all(
    directoryEntries.map(async (directoryEntry) => {
      const from = resolveUrl(directoryEntry, sourceUrl)
      const to = resolveUrl(directoryEntry, destinationUrl)
      await moveFileSystemNode(from, to, { overwrite, followLink })
    }),
  )
}
