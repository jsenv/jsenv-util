import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const readFileSystemNodeModificationTime = async (source) => {
  const stats = await readFileSystemNodeStat(source)
  return Math.floor(stats.mtimeMs)
}
