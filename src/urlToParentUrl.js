import { urlToOrigin } from "./urlToOrigin.js"
import { urlToRessource } from "./urlToRessource.js"

export const urlToParentUrl = (url) => {
  const ressource = urlToRessource(url)
  const slashLastIndex = ressource.lastIndexOf("/")
  if (slashLastIndex === -1) {
    return url
  }

  const lastCharacterIndex = ressource.length - 1
  if (slashLastIndex === lastCharacterIndex) {
    const slashPreviousIndex = ressource.lastIndexOf("/", lastCharacterIndex - 1)
    if (slashPreviousIndex === -1) {
      return url
    }

    const origin = urlToOrigin(url)
    return `${origin}${ressource.slice(0, slashPreviousIndex + 1)}`
  }

  const origin = urlToOrigin(url)

  return `${origin}${ressource.slice(0, slashLastIndex + 1)}`
}
