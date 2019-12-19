import { pathToFileURL } from "url"

export const filePathToUrl = (path) => {
  return path.startsWith("file://") ? path : String(pathToFileURL(path))
}
