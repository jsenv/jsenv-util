import { lstat, stat, existsSync } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { writeFileSystemNodePermissions } from "./writeFileSystemNodePermissions.js"

const isWindows = process.platform === "win32"

export const readFileSystemNodeStat = async (
  source,
  { nullIfNotFound = false, followLink = true } = {},
) => {
  if (source.endsWith("/")) source = source.slice(0, -1)

  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const handleNotFoundOption = nullIfNotFound
    ? {
        handleNotFoundError: () => null,
      }
    : {}

  return readStat(sourcePath, {
    followLink,
    ...handleNotFoundOption,
    ...(isWindows
      ? {
          // Windows can EPERM on stat
          handlePermissionDeniedError: async (error) => {
            // unfortunately it means we mutate the permissions
            // without being able to restore them to the previous value
            // (because reading current permission would also throw)
            try {
              await writeFileSystemNodePermissions(sourceUrl, 0o666)
              const stats = await readStat(sourcePath, {
                followLink,
                ...handleNotFoundOption,
                // could not fix the permission error, give up and throw original error
                handlePermissionDeniedError: () => {
                  throw error
                },
              })
              return stats
            } catch (e) {
              // failed to write permission or readState, throw original error as well
              throw error
            }
          },
        }
      : {}),
  })
}

const readStat = (
  sourcePath,
  { followLink, handleNotFoundError = null, handlePermissionDeniedError = null } = {},
) => {
  const nodeMethod = followLink ? stat : lstat

  return new Promise((resolve, reject) => {
    nodeMethod(sourcePath, (error, statsObject) => {
      if (error) {
        if (
          handleNotFoundError &&
          (error.code === "ENOENT" || (error.code === "EPERM" && !existsSync(sourcePath)))
        ) {
          resolve(handleNotFoundError(error))
        } else if (
          handlePermissionDeniedError &&
          (error.code === "EPERM" || error.code === "EACCES")
        ) {
          resolve(handlePermissionDeniedError(error))
        } else {
          reject(error)
        }
      } else {
        resolve(statsObject)
      }
    })
  })
}
