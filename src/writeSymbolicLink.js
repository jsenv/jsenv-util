import { promises } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { isFileSystemPath } from "./isFileSystemPath.js"
import { writeParentDirectories } from "./writeParentDirectories.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fspromises_symlink_target_path_type
const { symlink } = promises

export const writeSymbolicLink = async (destination, target, { type } = {}) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination)

  let targetValue
  if (typeof target === "string") {
    // absolute filesystem path
    if (isFileSystemPath(target)) {
      targetValue = target
    }
    // relative url
    else if (target.startsWith("./") || target.startsWith("../")) {
      targetValue = target
    }
    // absolute url
    else {
      const targetUrl = String(new URL(target, destinationUrl))
      targetValue = urlToFileSystemPath(targetUrl)
    }
  } else if (target instanceof URL) {
    targetValue = urlToFileSystemPath(target)
  } else {
    throw new TypeError(`symbolic link target must be a string or an url, received ${target}`)
  }

  const symbolicLinkPath = urlToFileSystemPath(destinationUrl)
  try {
    await symlink(targetValue, symbolicLinkPath, type)
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeParentDirectories(destinationUrl)
      await symlink(targetValue, symbolicLinkPath, type)
      return
    }
    throw error
  }
}
