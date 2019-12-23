import { getCommonPathname } from "./internal/getCommonPathname.js"
import { pathnameToDirectoryPathname } from "./internal/pathnameToDirectoryPathname.js"

export const urlToRelativeUrl = (urlArg, baseUrlArg) => {
  const url = new URL(urlArg)
  const baseUrl = new URL(baseUrlArg)

  if (url.protocol !== baseUrl.protocol) {
    return urlArg
  }

  if (url.username !== baseUrl.username || url.password !== baseUrl.password) {
    return urlArg.slice(url.protocol.length)
  }

  if (url.host !== baseUrl.host) {
    return urlArg.slice(url.protocol.length)
  }

  const { pathname, hash, search } = url
  if (pathname === "/") {
    return baseUrl.pathname.slice(1)
  }

  const { pathname: basePathname } = baseUrl

  const commonPathname = getCommonPathname(pathname, basePathname)
  if (!commonPathname) {
    return urlArg
  }

  const specificPathname = pathname.slice(commonPathname.length)
  const baseSpecificPathname = basePathname.slice(commonPathname.length)
  const baseSpecificDirectoryPathname = pathnameToDirectoryPathname(baseSpecificPathname)
  const relativeDirectoriesNotation = baseSpecificDirectoryPathname.replace(/.*?\//g, "../")

  const relativePathname = `${relativeDirectoriesNotation}${specificPathname}`
  return `${relativePathname}${search}${hash}`
}
