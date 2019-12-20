import { removeDirectory } from "./removeDirectory.js"
import { createDirectory } from "./createDirectory.js"

export const cleanDirectory = async (directoryUrl) => {
  await removeDirectory(directoryUrl)
  await createDirectory(directoryUrl)
}
