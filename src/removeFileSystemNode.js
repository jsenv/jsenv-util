import { unlink, rmdir } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { ensureUrlTrailingSlash } from "./ensureUrlTrailingSlash.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { readDirectory } from "./readDirectory.js"
import { resolveUrl } from "./resolveUrl.js"

export const removeFileSystemNode = async (
  source,
  { uselessError = false, recursive = false, maxRetries = 3, retryDelay = 100 } = {},
) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)

  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followSymbolicLink: false,
  })
  if (!sourceStats) {
    if (uselessError) {
      throw new Error(`nothing to remove at ${urlToFileSystemPath(sourceUrl)}`)
    }
    return
  }

  // https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_class_fs_stats
  // FIFO and socket are ignored, not sure what they are exactly and what to do with them
  // other libraries ignore them, let's do the same.
  if (sourceStats.isDirectory()) {
    await removeDirectory(ensureUrlTrailingSlash(sourceUrl), {
      recursive,
      maxRetries,
      retryDelay,
    })
  } else if (
    sourceStats.isFile() ||
    sourceStats.isSymbolicLink() ||
    sourceStats.isCharacterDevice() ||
    sourceStats.isBlockDevice()
  ) {
    await removeNonDirectory(sourceUrl.endsWith("/") ? sourceUrl.slice(0, -1) : sourceUrl, {
      maxRetries,
      retryDelay,
    })
  }
}

const removeNonDirectory = (sourceUrl, { maxRetries, retryDelay }) => {
  const sourcePath = urlToFileSystemPath(sourceUrl)

  let retryCount = 0
  const attempt = () => {
    return unlinkNaive(sourcePath, {
      ...(retryCount >= maxRetries
        ? {}
        : {
            handleTemporaryError: async () => {
              retryCount++
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(attempt())
                }, retryCount * retryDelay)
              })
            },
          }),
    })
  }
  return attempt()
}

const unlinkNaive = (sourcePath, { handleTemporaryError = null } = {}) => {
  return new Promise((resolve, reject) => {
    unlink(sourcePath, (error) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else if (
          handleTemporaryError &&
          (error.code === "EBUSY" ||
            error.code === "EMFILE" ||
            error.code === "ENFILE" ||
            error.code === "ENOENT")
        ) {
          resolve(handleTemporaryError(error))
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })
}

const removeDirectory = async (rootDirectoryUrl, { maxRetries, retryDelay, recursive }) => {
  const visit = async (sourceUrl) => {
    const sourceStats = await readFileSystemNodeStat(sourceUrl, {
      nullIfNotFound: true,
      followSymbolicLink: false,
    })

    // file/directory not found
    if (sourceStats === null) {
      return
    }

    if (sourceStats.isFile() || sourceStats.isCharacterDevice() || sourceStats.isBlockDevice()) {
      await visitFile(sourceUrl)
    } else if (sourceStats.isSymbolicLink()) {
      await visitSymbolicLink(sourceUrl)
    } else if (sourceStats.isDirectory()) {
      await visitDirectory(`${sourceUrl}/`)
    }
  }

  const visitDirectory = async (directoryUrl) => {
    const directoryPath = urlToFileSystemPath(directoryUrl)
    await removeDirectoryNaive(directoryPath, {
      ...(recursive
        ? {
            handleNotEmptyError: async () => {
              await removeDirectoryContent(directoryUrl)
              await visitDirectory(directoryUrl)
            },
          }
        : {}),
    })
  }

  const removeDirectoryContent = async (directoryUrl) => {
    const names = await readDirectory(directoryUrl)
    await Promise.all(
      names.map(async (name) => {
        const url = resolveUrl(name, directoryUrl)
        await visit(url)
      }),
    )
  }

  const visitFile = async (fileUrl) => {
    await removeNonDirectory(fileUrl, { maxRetries, retryDelay })
  }

  const visitSymbolicLink = async (symbolicLinkUrl) => {
    await removeNonDirectory(symbolicLinkUrl, { maxRetries, retryDelay })
  }

  await visitDirectory(rootDirectoryUrl)
}

const removeDirectoryNaive = (directoryPath, { handleNotEmptyError = null } = {}) => {
  return new Promise((resolve, reject) => {
    rmdir(directoryPath, (error, lstatObject) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else if (
          handleNotEmptyError &&
          // linux os
          (error.code === "ENOTEMPTY" ||
            // SunOS
            error.code === "EEXIST" ||
            // windows os
            error.code === "EPERM")
        ) {
          resolve(handleNotEmptyError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(lstatObject)
      }
    })
  })
}
