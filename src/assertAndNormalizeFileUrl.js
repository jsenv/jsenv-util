import { urlHasScheme } from "./urlHasScheme.js"
import { filePathToUrl } from "./filePathToUrl.js"

export const assertAndNormalizeFileUrl = (value) => {
  if (value instanceof URL) {
    value = value.href
  }

  if (typeof value === "string") {
    const url = urlHasScheme(value) ? value : filePathToUrl(value)

    if (!url.startsWith("file://")) {
      throw new Error(`fileUrl must starts with file://, received ${value}`)
    }

    return url
  }

  throw new TypeError(`fileUrl must be a string or an url, received ${value}`)
}
