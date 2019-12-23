export const urlToScheme = (url) => {
  const colonIndex = url.indexOf(":")
  if (colonIndex === -1) return ""
  return url.slice(0, colonIndex)
}
