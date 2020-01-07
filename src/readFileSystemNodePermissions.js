import { promises } from "fs"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

const { stat } = promises

export const readFileSystemNodePermissions = async (source) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const { mode } = await stat(sourcePath)
  return binaryFlagsToPermissions(mode)
}
