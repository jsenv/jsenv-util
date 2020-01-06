import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const readTimestamps = async (value) => {
  const stats = await readFileSystemNodeStat(value)
  return {
    atime: stats.atimeMs,
    mtime: stats.mtimeMs,
  }
}
