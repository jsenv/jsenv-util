import { createCancellationToken, createOperation } from "@jsenv/cancellation"
import { normalizeSpecifierMetaMap, urlCanContainsMetaMatching, urlToMeta } from "@jsenv/url-meta"
import { ensureUrlTrailingSlash } from "./internal/ensureUrlTrailingSlash.js"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readDirectory } from "./readDirectory.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"
import { comparePathnames } from "./comparePathnames.js"

export const collectDirectoryMatchReport = async ({
  cancellationToken = createCancellationToken(),
  directoryUrl,
  specifierMetaMap,
  predicate,
}) => {
  const matchingArray = []
  const ignoredArray = []

  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`)
  }
  const specifierMetaMapNormalized = normalizeSpecifierMetaMap(specifierMetaMap, rootDirectoryUrl)

  const visitDirectory = async (directoryUrl) => {
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryUrl),
    })

    await Promise.all(
      directoryItems.map(async (directoryItem) => {
        const directoryChildNodeUrl = `${directoryUrl}${directoryItem}`
        const relativeUrl = urlToRelativeUrl(directoryChildNodeUrl, rootDirectoryUrl)

        const directoryChildNodeStats = await createOperation({
          cancellationToken,
          start: () =>
            readFileSystemNodeStat(directoryChildNodeUrl, {
              // we ignore symlink because recursively traversed
              // so symlinked file will be discovered.
              // Moreover if they lead outside of directoryPath it can become a problem
              // like infinite recursion of whatever.
              // that we could handle using an object of pathname already seen but it will be useless
              // because directoryPath is recursively traversed
              followLink: false,
            }),
        })

        if (directoryChildNodeStats.isDirectory()) {
          const subDirectoryUrl = `${directoryChildNodeUrl}/`

          if (
            !urlCanContainsMetaMatching({
              url: subDirectoryUrl,
              specifierMetaMap: specifierMetaMapNormalized,
              predicate,
            })
          ) {
            ignoredArray.push({
              relativeUrl: ensureUrlTrailingSlash(relativeUrl),
              fileStats: directoryChildNodeStats,
            })

            return
          }

          await visitDirectory(subDirectoryUrl)
          return
        }

        if (directoryChildNodeStats.isFile()) {
          const meta = urlToMeta({
            url: directoryChildNodeUrl,
            specifierMetaMap: specifierMetaMapNormalized,
          })
          if (!predicate(meta)) {
            ignoredArray.push({ relativeUrl, meta, fileStats: directoryChildNodeStats })
            return
          }

          matchingArray.push({ relativeUrl, meta, fileStats: directoryChildNodeStats })
          return
        }
      }),
    )
  }
  await visitDirectory(rootDirectoryUrl)

  return {
    matchingArray: sortByRelativeUrl(matchingArray),
    ignoredArray: sortByRelativeUrl(ignoredArray),
  }
}

const sortByRelativeUrl = (array) =>
  array.sort((left, right) => {
    return comparePathnames(left.relativeUrl, right.relativeUrl)
  })
