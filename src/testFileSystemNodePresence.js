import { promises, constants } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fspromises_access_path_mode
const { access } = promises
const { F_OK } = constants

export const testFileSystemNodePresence = async (source, { followSymbolicLink = true } = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  try {
    await access(sourcePath, F_OK)
    return true
  } catch (e) {
    if (e.code === "ENOENT") {
      if (!followSymbolicLink) {
        const stats = await readFileSystemNodeStat(sourceUrl, {
          followSymbolicLink: false,
          nullIfNotFound: true,
        })
        return Boolean(stats && stats.isSymbolicLink())
      }
      return false
    }
    return false
  }
}
