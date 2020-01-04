import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"

import { readPermissions } from "./readPermissions.js"
import { writePermissions } from "./writePermissions.js"

export const grantPermission = async (url, { read = false, write = false, execute = false }) => {
  const fileUrl = assertAndNormalizeFileUrl(url)

  const filePermissions = await readPermissions(fileUrl)
  await writePermissions(fileUrl, {
    owner: { read, write, execute },
    group: { read, write, execute },
    others: { read, write, execute },
  })
  return async () => {
    await writePermissions(fileUrl, filePermissions)
  }
}
