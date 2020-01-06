import { assert } from "@jsenv/assert"
import {
  createDirectory,
  resolveUrl,
  cleanDirectory,
  writeFile,
  copyFile,
  readFile,
  writePermissions,
  writeTimestamps,
  readPermissions,
  readTimestamps,
  urlToFileSystemPath,
  removeDirectory,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const destinationDirectoryUrl = resolveUrl("otherdir/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("file.txt", destinationDirectoryUrl)
await cleanDirectory(tempDirectoryUrl)

// source does not exists
try {
  await copyFile(fileUrl, fileDestinationUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `copyFile must be called on a file, nothing found at ${urlToFileSystemPath(fileUrl)}`,
  )
  assert({ actual, expected })
}

// source is a directory
await createDirectory(directoryUrl)
try {
  await copyFile(directoryUrl, fileDestinationUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `copyFile must be called on a file, found directory at ${urlToFileSystemPath(
      fileDestinationUrl,
    )}`,
  )
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
}

// destination does not exists
{
  const sourceContent = "hello"
  const sourceMtime = Date.now()
  const sourcePermissions = {
    owner: { read: true, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    others: { read: false, write: false, execute: false },
  }

  await writeFile(fileUrl, "hello")
  await writePermissions(fileUrl, sourcePermissions)
  await writeTimestamps(fileUrl, { mtime: sourceMtime })
  await copyFile(fileUrl, fileDestinationUrl)

  const actual = {
    sourceContent: await readFile(fileUrl),
    sourcePermissions: await readPermissions(fileUrl),
    sourceTimestamps: await readTimestamps(fileUrl),
    destinationContent: await readFile(fileDestinationUrl),
    destinationPermissions: await readPermissions(fileDestinationUrl),
    destinationTimestamps: await readTimestamps(fileDestinationUrl),
  }
  const expected = {
    sourceContent,
    sourcePermissions: {
      owner: { ...sourcePermissions.owner },
      group: { ...sourcePermissions.group },
      others: { ...sourcePermissions.others },
    },
    sourceTimestamps: {
      // reading atime mutates its value, so we cant assert something about it
      atime: actual.sourceTimestamps.atime,
      mtime: sourceMtime,
    },
    destinationContent: sourceContent,
    destinationPermissions: sourcePermissions,
    destinationTimestamps: {
      // reading atime mutates its value, so we cant assert something about it
      atime: actual.destinationTimestamps.atime,
      mtime: sourceMtime,
    },
  }
  assert({ actual, expected })
  await removeDirectory(directoryUrl, { removeContent: true })
  await removeDirectory(destinationDirectoryUrl, { removeContent: true })
}

// destination is a file and overwrite disabled

// destination is a file and overwrite enabled

// destination is a directory

//
