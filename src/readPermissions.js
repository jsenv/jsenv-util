import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { readLStat } from "./readLStat.js"

export const readPermissions = async (value) => {
  const stats = await readLStat(value)
  return binaryFlagsToPermissions(stats.mode)
}
