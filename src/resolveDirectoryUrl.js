import { resolveUrl } from "./resolveUrl.js"
import { ensureUrlTrailingSlash } from "./ensureUrlTrailingSlash.js"

export const resolveDirectoryUrl = (specifier, baseUrl) => {
  const url = resolveUrl(specifier, baseUrl)
  return ensureUrlTrailingSlash(url)
}
