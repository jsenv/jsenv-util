import { promises } from "fs"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"
import { ensureParentDirectories } from "./ensureParentDirectories.js"

// https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fspromises_writefile_file_data_options
const { writeFile: writeFileNode } = promises

export const writeFile = async (destination, content) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination)

  const destinationPath = urlToFileSystemPath(destinationUrl)
  try {
    await writeFileNode(destinationPath, content)
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureParentDirectories(destinationUrl)
      await writeFileNode(destinationPath, content)
      return
    }
    throw error
  }
}
