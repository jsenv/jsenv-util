import { dirname, basename } from "path"
import { fileSystemNodeToTypeOrNull } from "./internal/fileSystemNodeToTypeOrNull.js"
import { createWatcher } from "./internal/createWatcher.js"
import { trackRessources } from "./internal/trackRessources.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const registerFileLifecycle = async (
  source,
  { added, updated, removed, notifyExistent = false, keepProcessAlive = true },
) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  if (!undefinedOrFunction(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`)
  }
  if (!undefinedOrFunction(updated)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`)
  }
  if (!undefinedOrFunction(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`)
  }

  const tracker = trackRessources()

  const handleFileFound = ({ existent }) => {
    const fileMutationStopWatching = watchFileMutation(sourceUrl, {
      updated,
      removed: () => {
        fileMutationStopTracking()
        watchFileAdded()
        if (removed) {
          removed()
        }
      },
      keepProcessAlive,
    })
    const fileMutationStopTracking = tracker.registerCleanupCallback(fileMutationStopWatching)

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({ existent: true })
        }
      } else {
        added({})
      }
    }
  }

  const watchFileAdded = () => {
    const fileCreationStopWatching = watchFileCreation(
      sourceUrl,
      () => {
        fileCreationgStopTracking()
        handleFileFound({ existent: false })
      },
      keepProcessAlive,
    )
    const fileCreationgStopTracking = tracker.registerCleanupCallback(fileCreationStopWatching)
  }

  const sourceType = fileSystemNodeToTypeOrNull(sourceUrl)
  if (sourceType === null) {
    if (added) {
      watchFileAdded()
    } else {
      throw new Error(`${urlToFileSystemPath(sourceUrl)} must lead to a file, found nothing`)
    }
  } else if (sourceType === "file") {
    handleFileFound({ existent: true })
  } else {
    throw new Error(`${urlToFileSystemPath(sourceUrl)} must lead to a file, type found instead`)
  }

  return tracker.cleanup
}

const undefinedOrFunction = (value) => typeof value === "undefined" || typeof value === "function"

const watchFileCreation = (source, callback, keepProcessAlive) => {
  const sourcePath = urlToFileSystemPath(source)
  const sourceFilename = basename(sourcePath)
  const directoryPath = dirname(sourcePath)
  let directoryWatcher = createWatcher(directoryPath, { persistent: keepProcessAlive })
  directoryWatcher.on("change", (eventType, filename) => {
    if (filename && filename !== sourceFilename) return

    const type = fileSystemNodeToTypeOrNull(source)
    // ignore if something else with that name gets created
    // we are only interested into files
    if (type !== "file") return

    directoryWatcher.close()
    directoryWatcher = undefined
    callback()
  })

  return () => {
    if (directoryWatcher) {
      directoryWatcher.close()
    }
  }
}

const watchFileMutation = (sourceUrl, { updated, removed, keepProcessAlive }) => {
  let watcher = createWatcher(urlToFileSystemPath(sourceUrl), { persistent: keepProcessAlive })

  watcher.on("change", () => {
    const sourceType = fileSystemNodeToTypeOrNull(sourceUrl)

    if (sourceType === null) {
      watcher.close()
      watcher = undefined
      if (removed) {
        removed()
      }
    } else if (sourceType === "file") {
      if (updated) {
        updated()
      }
    }
  })

  return () => {
    if (watcher) {
      watcher.close()
    }
  }
}
