export const urlsHaveSameOrigin = (url, otherUrl) => {
  return new URL(url).origin === new URL(otherUrl).origin
}
