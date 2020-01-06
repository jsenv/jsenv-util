import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { readLStat } from "./readLStat.js"

export const fileExists = async (value) => {
  const fileUrl = assertAndNormalizeFileUrl(value)

  const stat = await readLStat(fileUrl, { nullIfNotFound: true })
  return Boolean(stat && !stat.isDirectory())
}
