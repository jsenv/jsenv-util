import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { writeDirectory } from "./writeDirectory.js"

// ideally we should only remove directory content instead of recreating it
export const ensureEmptyDirectory = async (directoryUrl) => {
  await removeFileSystemNode(directoryUrl, { allowUseless: true, recursive: true })
  await writeDirectory(directoryUrl)
}
