import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { readFileSystemNodePermissions } from "./readFileSystemNodePermissions.js"
import { writeFileSystemNodePermissions } from "./writeFileSystemNodePermissions.js"

export const grantPermissionsOnFileSystemNode = async (
  source,
  { read = false, write = false, execute = false },
) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)

  const filePermissions = await readFileSystemNodePermissions(sourceUrl)
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read, write, execute },
    group: { read, write, execute },
    others: { read, write, execute },
  })
  return async () => {
    await writeFileSystemNodePermissions(sourceUrl, filePermissions)
  }
}
