import { urlToPathname } from "./urlToPathname.js"

export const urlToFilename = (url) => {
  const pathname = urlToPathname(url)
  const slashLastIndex = pathname.lastIndexOf("/")
  const filename = slashLastIndex === -1 ? pathname : pathname.slice(slashLastIndex + 1)
  return filename
}
