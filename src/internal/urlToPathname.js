import { urlToRessource } from "./urlToRessource.js"

export const urlToPathname = (url) => {
  return ressourceToPathname(urlToRessource(url))
}

const ressourceToPathname = (ressource) => {
  const searchSeparatorIndex = ressource.indexOf("?")
  return searchSeparatorIndex === -1 ? ressource : ressource.slice(0, searchSeparatorIndex)
}
