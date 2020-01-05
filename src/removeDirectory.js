import { rmdir } from "fs"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { resolveUrl } from "./resolveUrl.js"
import { readDirectory } from "./readDirectory.js"
import { removeFile } from "./removeFile.js"
import { grantPermission } from "./grantPermission.js"
import { readLStat } from "./readLStat.js"

export const removeDirectory = async (url, { removeContent = false } = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url)

  const visit = async (url) => {
    const filesystemStat = await readLStat(url, { nullIfNotFound: true })

    // file/directory not found
    if (filesystemStat === null) {
      return
    }

    if (filesystemStat.isDirectory()) {
      await visitDirectory(url)
    } else if (
      filesystemStat.isFile() ||
      filesystemStat.isCharacterDevice() ||
      filesystemStat.isBlockDevice()
    ) {
      await visitFile(url)
    } else if (filesystemStat.isSymbolicLink()) {
      await visitSymbolicLink(url)
    }
  }

  const visitDirectory = async (directoryUrl) => {
    const directoryPath = urlToFileSystemPath(directoryUrl)
    await removeDirectoryNaive(directoryPath, {
      ...(removeContent
        ? {
            handleNotEmptyError: async () => {
              await removeDirectoryContent(directoryUrl)
              await visitDirectory(directoryUrl)
            },
          }
        : {}),
      handlePermissionDeniedError: async () => {
        const restoreDirectoryPermission = await grantPermission(directoryUrl, {
          read: true,
          write: true,
          execute: true,
        })
        try {
          await visitDirectory(directoryUrl)
        } catch (e) {
          await restoreDirectoryPermission() // in case of failure restore directory as it was
          throw e
        }
      },
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
    await removeFile(fileUrl)
  }

  const visitSymbolicLink = async (symbolicLinkUrl) => {
    await removeFile(symbolicLinkUrl)
  }

  await visitDirectory(directoryUrl)
}

const removeDirectoryNaive = (
  directoryPath,
  { handleNotEmptyError = null, handlePermissionDeniedError = null } = {},
) => {
  return new Promise((resolve, reject) => {
    rmdir(directoryPath, (error, lstatObject) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else if (handleNotEmptyError && (error.code === "ENOTEMPTY" || error.code === "EEXIST")) {
          resolve(handleNotEmptyError(error))
        } else if (
          handlePermissionDeniedError &&
          (error.code === "EPERM" || error.code === "EACCES")
        ) {
          resolve(handlePermissionDeniedError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(lstatObject)
      }
    })
  })
}
