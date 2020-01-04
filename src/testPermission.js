import { promises, constants } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const { access } = promises
const {
  // F_OK,
  R_OK,
  W_OK,
  X_OK,
} = constants

export const testPermission = async (
  url,
  { read = false, write = false, execute = false } = {},
) => {
  const fileSystemUrl = assertAndNormalizeFileUrl(url)
  const fileSystemPath = urlToFileSystemPath(fileSystemUrl)
  let binaryFlags = 0

  // if (visible) binaryFlags |= F_OK
  if (read) binaryFlags |= R_OK
  if (write) binaryFlags |= W_OK
  if (execute) binaryFlags |= X_OK

  try {
    await access(fileSystemPath, binaryFlags)
    return true
  } catch (e) {
    if (e.code === "ENOENT") {
      return true
    }
    return false
  }
}
