import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { writeDirectory } from "./writeDirectory.js"

// ideally we should only remove directory content instead of recreating it
export const cleanDirectory = async (directoryUrl) => {
  await removeFileSystemNode(directoryUrl, { recursive: true })
  await writeDirectory(directoryUrl)
}
