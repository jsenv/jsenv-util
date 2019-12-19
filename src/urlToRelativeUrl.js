export const urlToRelativeUrl = (url, baseUrl) => {
  if (typeof baseUrl !== "string") {
    throw new TypeError(`baseUrl must be a string, got ${baseUrl}`)
  }
  if (url.startsWith(baseUrl)) {
    // we should take into account only pathname
    // and ignore search params
    return url.slice(baseUrl.length)
  }
  return url
}
