import { fileSystemPathToUrl } from "./fileSystemPathToUrl.js"

const isWindows = process.platform === "win32"
const baseUrlFallback = fileSystemPathToUrl(process.cwd())

export const resolveUrlPreservingWindowsDriveLetter = (specifier, baseUrl) => {
  if (!isWindows) {
    throw new Error(`resolveUrlPreservingWindowsDriveLetter should be called on windows`)
  }
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing to resolve ${specifier}`)
  }

  const url = String(new URL(specifier, baseUrl))
  /*
    we want the following a special url resolution on windows regarding files:

    resolveFileSystemUrl("/file.js", "file:///C:/dir/file.js")
    -> file:///C:/file.js

    resolveFileSystemUrl("file:///file.js", "file:///C:/dir/file.js")
    -> file:///C:/file.js

    resolveFileSystemUrl("//file.js", "file:///C:/dir/file.js")
    -> file:///C:/file.js

    This is to be sure we don't loose the drive letter otherwise the url becomes invalid
    when we try to read the corresponding file later on
    */
  if (url.startsWith("file://")) {
    const afterProtocol = url.slice("file://".length)
    // we still have the windows drive letter
    if (extractDriveLetter(afterProtocol)) {
      return url
    }

    // drive letter was lost, restore it
    const baseUrlOrFallback = baseUrl.startsWith("file://") ? baseUrl : baseUrlFallback
    const driveLetter = extractDriveLetter(baseUrlOrFallback.slice("file://".length))
    if (!driveLetter) {
      throw new Error(
        `cannot properly resolve ${specifier} because baseUrl (${baseUrl}) has no drive letter`,
      )
    }
    return `file:///${driveLetter}:${afterProtocol}`
  }

  return url
}

const extractDriveLetter = (ressource) => {
  // we still have the windows drive letter
  if (/[a-zA-Z]/.test(ressource[1]) && ressource[2] === ":") {
    return ressource[1]
  }
  return null
}
