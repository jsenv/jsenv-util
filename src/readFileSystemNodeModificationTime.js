import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"

export const readFileSystemNodeModificationTime = async (source) => {
  const stats = await readFileSystemNodeStat(source)
  return Math.round(stats.mtimeMs)
}
