import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  createDirectory,
  writeFile,
  urlToFileSystemPath,
  removeFile,
  moveDirectory,
  removeDirectory,
  directoryExists,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const destinationParentDirectoryUrl = resolveUrl("otherdir/", tempDirectoryUrl)
const destinationDirectoryUrl = resolveUrl("directory-renamed/", destinationParentDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
const fileDestinationUrl = resolveUrl("file.txt", tempDirectoryUrl)
await createDirectory(tempDirectoryUrl)

// source directory does not exists
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
  await removeFile(fileUrl)
}

// destination does not exists
{
  await createDirectory(directoryUrl)
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
await createDirectory(directoryUrl)
try {
  await moveDirectory(directoryUrl, fileDestinationUrl)
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(directoryUrl)} at ${urlToFileSystemPath(
      fileDestinationUrl,
    )}/ because destination is not a directory`,
  )
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
  await removeFile(fileDestinationUrl)
}

// destination is a directory
await createDirectory(destinationDirectoryUrl)
await createDirectory(directoryUrl)
try {
  await moveDirectory(directoryUrl, destinationDirectoryUrl)
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(directoryUrl)} at ${urlToFileSystemPath(
      destinationDirectoryUrl,
    )} because there is already a directory and overwrite option is disabled`,
  )
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
  await removeDirectory(destinationDirectoryUrl)
}

// destination is a directory and overwrite enabled
{
  await createDirectory(destinationDirectoryUrl)
  await createDirectory(directoryUrl)
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
