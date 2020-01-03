import { readLStat } from "./readLStat.js"

export const readPermissions = async (value) => {
  const stats = await readLStat(value)
  return stats.mode
}
