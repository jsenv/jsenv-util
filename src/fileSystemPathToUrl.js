import { pathToFileURL } from "url"

export const fileSystemPathToUrl = (path) => {
  return String(pathToFileURL(path))
}
