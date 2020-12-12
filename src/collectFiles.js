import { createCancellationToken, createOperation } from "@jsenv/cancellation"
import { normalizeStructuredMetaMap, urlCanContainsMetaMatching, urlToMeta } from "@jsenv/url-meta"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { readDirectory } from "./readDirectory.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"
import { comparePathnames } from "./comparePathnames.js"

export const collectFiles = async ({
  cancellationToken = createCancellationToken(),
  directoryUrl,
  structuredMetaMap,
  predicate,
  matchingFileOperation = () => null,
}) => {
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`)
  }
  if (typeof matchingFileOperation !== "function") {
    throw new TypeError(`matchingFileOperation must be a function, got ${matchingFileOperation}`)
  }
  const structuredMetaMapNormalized = normalizeStructuredMetaMap(
    structuredMetaMap,
    rootDirectoryUrl,
  )

  const matchingFileResultArray = []
  const visitDirectory = async (directoryUrl) => {
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryUrl),
    })

    await Promise.all(
      directoryItems.map(async (directoryItem) => {
        const directoryChildNodeUrl = `${directoryUrl}${directoryItem}`

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
              structuredMetaMap: structuredMetaMapNormalized,
              predicate,
            })
          ) {
            return
          }

          await visitDirectory(subDirectoryUrl)
          return
        }

        if (directoryChildNodeStats.isFile()) {
          const meta = urlToMeta({
            url: directoryChildNodeUrl,
            structuredMetaMap: structuredMetaMapNormalized,
          })
          if (!predicate(meta)) return

          const relativeUrl = urlToRelativeUrl(directoryChildNodeUrl, rootDirectoryUrl)
          const operationResult = await createOperation({
            cancellationToken,
            start: () =>
              matchingFileOperation({
                cancellationToken,
                relativeUrl,
                meta,
                fileStats: directoryChildNodeStats,
              }),
          })
          matchingFileResultArray.push({
            relativeUrl,
            meta,
            fileStats: directoryChildNodeStats,
            operationResult,
          })
          return
        }
      }),
    )
  }
  await visitDirectory(rootDirectoryUrl)

  // When we operate on thoose files later it feels more natural
  // to perform operation in the same order they appear in the filesystem.
  // It also allow to get a predictable return value.
  // For that reason we sort matchingFileResultArray
  matchingFileResultArray.sort((leftFile, rightFile) => {
    return comparePathnames(leftFile.relativeUrl, rightFile.relativeUrl)
  })
  return matchingFileResultArray
}
