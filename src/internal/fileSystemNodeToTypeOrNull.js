import { statsSync } from "fs"
import { urlToFileSystemPath } from "../urlToFileSystemPath.js"
import { statsToType } from "./statsToType.js"

export const fileSystemNodeToTypeOrNull = (url) => {
  const path = urlToFileSystemPath(url)
  try {
    const stats = statsSync(path)
    return statsToType(stats)
  } catch (e) {
    if (e.code === "ENOENT") {
      return null
    }
    throw e
  }
}
