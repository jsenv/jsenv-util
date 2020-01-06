import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const fileExists = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)

  const stat = await readFileSystemNodeStat(fileUrl, { nullIfNotFound: true })
  return Boolean(stat && stat.isFile())
}
