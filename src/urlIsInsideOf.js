export const urlIsInsideOf = (urlValue, otherUrlValue) => {
  const url = new URL(urlValue)
  const otherUrl = new URL(otherUrlValue)

  if (url.origin !== otherUrl.origin) {
    return false
  }

  const urlPathname = url.pathname
  const otherUrlPathname = otherUrl.pathname
  if (urlPathname === otherUrlPathname) {
    return false
  }

  return urlPathname.startsWith(otherUrlPathname)
}
