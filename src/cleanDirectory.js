import { removeDirectory } from "./removeDirectory.js"
import { createDirectory } from "./createDirectory.js"

// ideally we should only remove directory content instead of recreating it
export const cleanDirectory = async (directoryUrl) => {
  await removeDirectory(directoryUrl, { removeContent: true })
  await createDirectory(directoryUrl)
}
