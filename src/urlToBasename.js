import { urlToFilename } from "./urlToFilename.js"

export const urlToBasename = (pathname) => {
  const filename = urlToFilename(pathname)
  const dotLastIndex = filename.lastIndexOf(".")
  const basename = dotLastIndex === -1 ? filename : filename.slice(0, dotLastIndex)
  return basename
}
