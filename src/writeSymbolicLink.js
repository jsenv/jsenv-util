import { promises } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { resolveUrl } from "./resolveUrl.js"
import { isFileSystemPath } from "./isFileSystemPath.js"
import { ensureParentDirectories } from "./ensureParentDirectories.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fspromises_symlink_target_path_type
const { symlink } = promises
const isWindows = process.platform === "win32"

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

  if (isWindows && typeof type === "undefined") {
    // without this if you write a symbolic link without specifying the type on windows
    // you later get EPERM when doing stat on the symlink
    const targetUrl = resolveUrl(targetValue, destinationUrl)
    const targetStats = await readFileSystemNodeStat(targetUrl, { nullIfNotFound: true })
    type = targetStats && targetStats.isDirectory() ? "dir" : "file"
  }

  const symbolicLinkPath = urlToFileSystemPath(destinationUrl)
  try {
    await symlink(targetValue, symbolicLinkPath, type)
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureParentDirectories(destinationUrl)
      await symlink(targetValue, symbolicLinkPath, type)
      return
    }
    throw error
  }
}
