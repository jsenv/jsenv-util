export const urlToScheme = (urlString) => {
  const colonIndex = urlString.indexOf(":")
  if (colonIndex === -1) {
    return ""
  }

  const scheme = urlString.slice(0, colonIndex)
  return scheme
}
