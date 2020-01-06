import { promises, constants } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fspromises_access_path_mode
const { access } = promises
const { F_OK } = constants

export const testFileSystemNodePresence = async (value) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(value)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)

  try {
    await access(fileSystemPath, F_OK)
    return true
  } catch (e) {
    if (e.code === "ENOENT") {
      return false
    }
    return false
  }
}
