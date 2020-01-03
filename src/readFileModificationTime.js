import { readFileStat } from "./readFileStat.js"

export const readFileModificationTime = async (value) => {
  const stats = await readFileStat(value)
  return stats.mtimeMs
}
