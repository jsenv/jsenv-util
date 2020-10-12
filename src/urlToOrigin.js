export const urlToOrigin = (url) => {
  if (url.startsWith("file://")) {
    return `file://`
  }
  return new URL(url).origin
}
