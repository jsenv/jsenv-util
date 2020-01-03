import { readLStat } from "./readLStat.js"

export const readTimestamps = async (value) => {
  const stats = await readLStat(value)
  return {
    atime: stats.atimeMs,
    mtime: stats.mtimeMs,
  }
}
