import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  writeDirectory,
  writeFile,
  urlToFileSystemPath,
  removeFileSystemNode,
  moveDirectory,
  directoryExists,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const destinationParentDirectoryUrl = resolveUrl("otherdir/", tempDirectoryUrl)
const destinationDirectoryUrl = resolveUrl("directory-renamed/", destinationParentDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
const fileDestinationUrl = resolveUrl("file.txt", tempDirectoryUrl)
await writeDirectory(tempDirectoryUrl)

// source does not exists
try {
  await moveDirectory(directoryUrl, destinationDirectoryUrl)
} catch (actual) {
  const expected = new Error(
    `moveDirectory must be called on a directory, nothing found at ${urlToFileSystemPath(
      directoryUrl,
    )}`,
  )
  assert({ actual, expected })
}

// source is a file
await writeFile(fileUrl)
try {
  await moveDirectory(fileUrl, destinationDirectoryUrl)
} catch (actual) {
  const expected = new Error(
    `moveDirectory must be called on a directory, found file at ${urlToFileSystemPath(fileUrl)}`,
  )
  assert({ actual, expected })
  await removeFileSystemNode(fileUrl)
}

// destination does not exists
{
  await writeDirectory(directoryUrl)
  await moveDirectory(directoryUrl, destinationDirectoryUrl)
  const actual = {
    sourceExists: await directoryExists(directoryUrl),
    destinationExists: await directoryExists(destinationDirectoryUrl),
  }
  const expected = {
    sourceExists: false,
    destinationExists: true,
  }
  assert({ actual, expected })
}

// destination is a file
await writeFile(fileDestinationUrl)
await writeDirectory(directoryUrl)
try {
  await moveDirectory(directoryUrl, fileDestinationUrl)
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(directoryUrl)} at ${urlToFileSystemPath(
      fileDestinationUrl,
    )}/ because destination is not a directory`,
  )
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
  await removeFileSystemNode(fileDestinationUrl)
}

// destination is a directory
await writeDirectory(destinationDirectoryUrl)
await writeDirectory(directoryUrl)
try {
  await moveDirectory(directoryUrl, destinationDirectoryUrl)
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(directoryUrl)} at ${urlToFileSystemPath(
      destinationDirectoryUrl,
    )} because there is already a directory and overwrite option is disabled`,
  )
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
  await removeFileSystemNode(destinationDirectoryUrl)
}

// destination is a directory and overwrite enabled
{
  await writeDirectory(destinationDirectoryUrl)
  await writeDirectory(directoryUrl)
  await moveDirectory(directoryUrl, destinationDirectoryUrl, { overwrite: true })
  const actual = {
    sourceExists: await directoryExists(directoryUrl),
    destinationExists: await directoryExists(destinationDirectoryUrl),
  }
  const expected = {
    sourceExists: false,
    destinationExists: true,
  }
  assert({ actual, expected })
}
