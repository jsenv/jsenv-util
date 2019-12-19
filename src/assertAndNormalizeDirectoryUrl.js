import { urlHasScheme } from "./urlHasScheme.js"
import { filePathToUrl } from "./filePathToUrl.js"
import { ensureUrlTrailingSlash } from "./ensureUrlTrailingSlash.js"

export const assertAndNormalizeDirectoryUrl = (value) => {
  if (value instanceof URL) {
    value = value.href
  }

  if (typeof value === "string") {
    const url = urlHasScheme(value) ? value : filePathToUrl(value)

    if (!url.startsWith("file://")) {
      throw new Error(`directoryUrl must starts with file://, received ${value}`)
    }

    return ensureUrlTrailingSlash(url)
  }

  throw new TypeError(`directoryUrl must be a string or an url, received ${value}`)
}
