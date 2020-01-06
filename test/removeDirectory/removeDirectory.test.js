import { assert } from "@jsenv/assert"
import {
  createDirectory,
  directoryExists,
  removeDirectory,
  resolveUrl,
  writeFile,
  writePermissions,
  urlToFileSystemPath,
  removeFile,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
const fileInsideDirectoryUrl = resolveUrl("file.js", directoryUrl)
await createDirectory(tempDirectoryUrl)

// directory does not exists
{
  await removeDirectory(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// empty directory
{
  await createDirectory(directoryUrl)
  await removeDirectory(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// empty directory without permission
{
  await createDirectory(directoryUrl)
  await writePermissions(directoryUrl, {
    other: { read: false, write: false, execute: false },
  })
  await removeDirectory(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory with content
await createDirectory(directoryUrl)
await writeFile(fileInsideDirectoryUrl)
try {
  await removeDirectory(directoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `ENOTEMPTY: directory not empty, rmdir '${urlToFileSystemPath(directoryUrl)}'`,
  )
  expected.errno = -66
  expected.code = "ENOTEMPTY"
  expected.syscall = "rmdir"
  expected.path = urlToFileSystemPath(directoryUrl)
  assert({ actual, expected })
  await removeDirectory(directoryUrl, { removeContent: true })
}

// directory with content and removeContent: true
{
  await createDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl)
  await removeDirectory(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory without permission and content and removeContent: true
await createDirectory(directoryUrl)
await writeFile(fileInsideDirectoryUrl)
await writePermissions(directoryUrl, {
  owner: { read: true, write: true, execute: false },
})
try {
  await removeDirectory(directoryUrl, { removeContent: true })
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `EACCES: permission denied, lstat '${urlToFileSystemPath(fileInsideDirectoryUrl)}'`,
  )
  expected.errno = -13
  expected.code = "EACCES"
  expected.syscall = "lstat"
  expected.path = urlToFileSystemPath(fileInsideDirectoryUrl)
  assert({ actual, expected })
  await writePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: true },
  })
  await removeDirectory(directoryUrl, { removeContent: true })
}

// directory with a busy file
await createDirectory(directoryUrl)
await makeBusyFile(fileInsideDirectoryUrl, async () => {
  await removeDirectory(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
})

// on a file
await writeFile(fileUrl)
try {
  await removeDirectory(fileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`ENOTDIR: not a directory, rmdir '${urlToFileSystemPath(fileUrl)}/'`)
  expected.errno = -20
  expected.code = "ENOTDIR"
  expected.syscall = "rmdir"
  expected.path = `${urlToFileSystemPath(fileUrl)}/`
  assert({ actual, expected })
  await removeFile(fileUrl)
}

// directory with a file without write permission
{
  await writeFile(fileInsideDirectoryUrl)
  await writePermissions(fileInsideDirectoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  await removeDirectory(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}
