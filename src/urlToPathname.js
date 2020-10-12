import { urlToRessource } from "./urlToRessource.js"

export const urlToPathname = (urlString) => {
  const ressource = urlToRessource(urlString)
  const pathname = ressourceToPathname(ressource)
  return pathname
}

const ressourceToPathname = (ressource) => {
  const searchSeparatorIndex = ressource.indexOf("?")
  return searchSeparatorIndex === -1 ? ressource : ressource.slice(0, searchSeparatorIndex)
}
