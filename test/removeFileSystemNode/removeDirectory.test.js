import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  directoryExists,
  resolveUrl,
  writeFile,
  writePermissions,
  urlToFileSystemPath,
  removeFileSystemNode,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
const fileInsideDirectoryUrl = resolveUrl("file.js", directoryUrl)
await writeDirectory(tempDirectoryUrl)

// directory does not exists
{
  await removeFileSystemNode(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// empty directory
{
  await writeDirectory(directoryUrl)
  await removeFileSystemNode(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// empty directory without permission
{
  await writeDirectory(directoryUrl)
  await writePermissions(directoryUrl, {
    other: { read: false, write: false, execute: false },
  })
  await removeFileSystemNode(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory with content
await writeDirectory(directoryUrl)
await writeFile(fileInsideDirectoryUrl)
try {
  await removeFileSystemNode(directoryUrl)
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
  await removeFileSystemNode(directoryUrl, { removeContent: true })
}

// directory with content and removeContent: true
{
  await writeDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl)
  await removeFileSystemNode(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory without permission and content and removeContent: true
await writeDirectory(directoryUrl)
await writeFile(fileInsideDirectoryUrl)
await writePermissions(directoryUrl, {
  owner: { read: true, write: true, execute: false },
})
try {
  await removeFileSystemNode(directoryUrl, { removeContent: true })
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
  await removeFileSystemNode(directoryUrl, { removeContent: true })
}

// directory with a busy file
await writeDirectory(directoryUrl)
await makeBusyFile(fileInsideDirectoryUrl, async () => {
  await removeFileSystemNode(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
})

// on a file
await writeFile(fileUrl)
try {
  await removeFileSystemNode(fileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`ENOTDIR: not a directory, rmdir '${urlToFileSystemPath(fileUrl)}/'`)
  expected.errno = -20
  expected.code = "ENOTDIR"
  expected.syscall = "rmdir"
  expected.path = `${urlToFileSystemPath(fileUrl)}/`
  assert({ actual, expected })
  await removeFileSystemNode(fileUrl)
}

// directory with a file without write permission
{
  await writeFile(fileInsideDirectoryUrl)
  await writePermissions(fileInsideDirectoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  await removeFileSystemNode(directoryUrl, { removeContent: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory with subdir and having content
{
  const rootDir = resolveUrl("root/", tempDirectoryUrl)
  const dirA = resolveUrl("dirA/", rootDir)
  const dirB = resolveUrl("dirA/", rootDir)
  const fileA = resolveUrl("fileA.js", dirA)
  const fileB = resolveUrl("fileB.js", dirB)
  await writeFile(fileA, "contentA")
  await writeFile(fileB, "contentB")
  await removeFileSystemNode(rootDir, { removeContent: true })
  const actual = await directoryExists(rootDir)
  const expected = false
  assert({ actual, expected })
}
