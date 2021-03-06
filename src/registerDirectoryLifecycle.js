/* eslint-disable import/max-dependencies */
import { readdirSync } from "fs"
import { normalizeStructuredMetaMap, urlCanContainsMetaMatching, urlToMeta } from "@jsenv/url-meta"
import { replaceBackSlashesWithSlashes } from "./internal/replaceBackSlashesWithSlashes.js"
import { fileSystemNodeToTypeOrNull } from "./internal/fileSystemNodeToTypeOrNull.js"
import { createWatcher } from "./internal/createWatcher.js"
import { trackRessources } from "./internal/trackRessources.js"
import { ensureUrlTrailingSlash } from "./internal/ensureUrlTrailingSlash.js"
import { resolveUrl } from "./resolveUrl.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"

const isLinux = process.platform === "linux"
// linux does not support recursive option
const fsWatchSupportsRecursive = !isLinux

export const registerDirectoryLifecycle = (
  source,
  {
    added,
    updated,
    removed,
    watchDescription = {
      "./**/*": true,
    },
    notifyExistent = false,
    keepProcessAlive = true,
    recursive = false,
  },
) => {
  const sourceUrl = ensureUrlTrailingSlash(assertAndNormalizeFileUrl(source))
  if (!undefinedOrFunction(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`)
  }
  if (!undefinedOrFunction(updated)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`)
  }
  if (!undefinedOrFunction(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`)
  }

  const structuredMetaMap = normalizeStructuredMetaMap({ watch: watchDescription }, sourceUrl)
  const entryShouldBeWatched = ({ relativeUrl, type }) => {
    const entryUrl = resolveUrl(relativeUrl, sourceUrl)

    if (type === "directory") {
      const canContainEntryToWatch = urlCanContainsMetaMatching({
        url: `${entryUrl}/`,
        structuredMetaMap,
        predicate: ({ watch }) => watch,
      })
      return canContainEntryToWatch
    }

    const entryMeta = urlToMeta({
      url: entryUrl,
      structuredMetaMap,
    })

    return entryMeta.watch
  }

  const tracker = trackRessources()

  const contentMap = new Map()

  const handleDirectoryEvent = ({ directoryRelativeUrl, filename, eventType }) => {
    if (filename) {
      if (directoryRelativeUrl) {
        handleChange(`${directoryRelativeUrl}/${filename}`)
      } else {
        handleChange(`${filename}`)
      }
    } else if ((removed || added) && eventType === "rename") {
      // we might receive `rename` without filename
      // in that case we try to find ourselves which file was removed.

      let relativeUrlCandidateArray = Array.from(contentMap.keys())

      if (recursive && !fsWatchSupportsRecursive) {
        relativeUrlCandidateArray = relativeUrlCandidateArray.filter((relativeUrlCandidate) => {
          if (!directoryRelativeUrl) {
            // ensure entry is top level
            if (relativeUrlCandidate.includes("/")) return false
            return true
          }

          // entry not inside this directory
          if (!relativeUrlCandidate.startsWith(directoryRelativeUrl)) return false

          const afterDirectory = relativeUrlCandidate.slice(directoryRelativeUrl.length + 1)
          // deep inside this directory
          if (afterDirectory.includes("/")) return false

          return true
        })
      }

      const removedEntryRelativeUrl = relativeUrlCandidateArray.find((relativeUrlCandidate) => {
        const entryUrl = resolveUrl(relativeUrlCandidate, sourceUrl)
        const type = fileSystemNodeToTypeOrNull(entryUrl)
        return type === null
      })

      if (removedEntryRelativeUrl) {
        handleEntryLost({
          relativeUrl: removedEntryRelativeUrl,
          type: contentMap.get(removedEntryRelativeUrl),
        })
      }
    }
  }

  const handleChange = (relativeUrl) => {
    const entryUrl = resolveUrl(relativeUrl, sourceUrl)
    const previousType = contentMap.get(relativeUrl)
    const type = fileSystemNodeToTypeOrNull(entryUrl)

    if (!entryShouldBeWatched({ relativeUrl, type })) {
      return
    }

    // it's something new
    if (!previousType) {
      if (type !== null) {
        handleEntryFound({ relativeUrl, type, existent: false })
      }
      return
    }

    // it existed but now it's not here anymore
    if (type === null) {
      handleEntryLost({ relativeUrl, type: previousType })
      return
    }

    // it existed and was replaced by something else
    // we don't handle this as an update. We rather say the ressource
    // is lost and something else is found (call removed() then added())
    if (previousType !== type) {
      handleEntryLost({ relativeUrl, type: previousType })
      handleEntryFound({ relativeUrl, type })
      return
    }

    // a directory cannot really be updated in way that matters for us
    // filesystem is trying to tell us the directory content have changed
    // but we don't care about that
    // we'll already be notified about what has changed
    if (type === "directory") {
      return
    }

    // something has changed at this relativeUrl (the file existed and was not deleted)
    // it's possible to get there and there is no real update
    // (file content is the same and file mtime is the same).
    // In short filesystem is sometimes "lying"
    // Not trying to guard against that because:
    // - hurt perfs a lot
    // - it happens very rarely
    // - it's not really a concern in practice
    // - filesystem did not send an event out of nowhere:
    // something occured but we don't know what with the information we have.
    if (updated) {
      updated({ relativeUrl, type })
    }
  }

  const handleEntryFound = ({ relativeUrl, type, existent }) => {
    if (!entryShouldBeWatched({ relativeUrl, type })) {
      return
    }

    contentMap.set(relativeUrl, type)

    const entryUrl = resolveUrl(relativeUrl, sourceUrl)

    if (type === "directory") {
      visitDirectory({
        directoryUrl: `${entryUrl}/`,
        entryFound: (entry) => {
          handleEntryFound({
            relativeUrl: `${relativeUrl}/${entry.relativeUrl}`,
            type: entry.type,
            existent,
          })
        },
      })
    }

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({ relativeUrl, type, existent: true })
        }
      } else {
        added({ relativeUrl, type })
      }
    }

    // we must watch manually every directory we find
    if (!fsWatchSupportsRecursive && type === "directory") {
      const watcher = createWatcher(urlToFileSystemPath(entryUrl), { persistent: keepProcessAlive })
      tracker.registerCleanupCallback(() => {
        watcher.close()
      })
      watcher.on("change", (eventType, filename) => {
        handleDirectoryEvent({
          directoryRelativeUrl: relativeUrl,
          filename: filename ? replaceBackSlashesWithSlashes(filename) : "",
          eventType,
        })
      })
    }
  }

  const handleEntryLost = ({ relativeUrl, type }) => {
    contentMap.delete(relativeUrl)
    if (removed) {
      removed({ relativeUrl, type })
    }
  }

  visitDirectory({
    directoryUrl: sourceUrl,
    entryFound: ({ relativeUrl, type }) => {
      handleEntryFound({ relativeUrl, type, existent: true })
    },
  })

  const watcher = createWatcher(urlToFileSystemPath(sourceUrl), {
    recursive: recursive && fsWatchSupportsRecursive,
    persistent: keepProcessAlive,
  })
  tracker.registerCleanupCallback(() => {
    watcher.close()
  })
  watcher.on("change", (eventType, fileSystemPath) => {
    handleDirectoryEvent({
      ...fileSystemPathToDirectoryRelativeUrlAndFilename(fileSystemPath),
      eventType,
    })
  })

  return tracker.cleanup
}

const undefinedOrFunction = (value) => typeof value === "undefined" || typeof value === "function"

const visitDirectory = ({ directoryUrl, entryFound }) => {
  const directoryPath = urlToFileSystemPath(directoryUrl)
  readdirSync(directoryPath).forEach((entry) => {
    const entryUrl = resolveUrl(entry, directoryUrl)
    const type = fileSystemNodeToTypeOrNull(entryUrl)
    if (type === null) {
      return
    }

    const relativeUrl = urlToRelativeUrl(entryUrl, directoryUrl)
    entryFound({
      relativeUrl,
      type,
    })
  })
}

const fileSystemPathToDirectoryRelativeUrlAndFilename = (path) => {
  if (!path) {
    return {
      directoryRelativeUrl: "",
      filename: "",
    }
  }

  const normalizedPath = replaceBackSlashesWithSlashes(path)
  const slashLastIndex = normalizedPath.lastIndexOf("/")
  if (slashLastIndex === -1) {
    return {
      directoryRelativeUrl: "",
      filename: normalizedPath,
    }
  }

  const directoryRelativeUrl = normalizedPath.slice(0, slashLastIndex)
  const filename = normalizedPath.slice(slashLastIndex + 1)
  return {
    directoryRelativeUrl,
    filename,
  }
}
