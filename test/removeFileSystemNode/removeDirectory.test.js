import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  writeDirectory,
  directoryExists,
  resolveUrl,
  writeFile,
  writeFileSystemNodePermissions,
  urlToFileSystemPath,
  removeFileSystemNode,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// directory does not exists
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const actual = await removeFileSystemNode(directoryUrl)
  const expected = undefined
  assert({ actual, expected })
}

// empty directory
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await removeFileSystemNode(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// empty directory without permission
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeFileSystemNodePermissions(directoryUrl, {
    other: { read: false, write: false, execute: false },
  })
  await removeFileSystemNode(directoryUrl)
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory with content
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
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
  } finally {
    await removeFileSystemNode(directoryUrl, { recursive: true })
  }
}

// directory with content and recursive enabled
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl)
  await removeFileSystemNode(directoryUrl, { recursive: true })
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// directory without permission and content and recursive enabled
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl)
  await writeFileSystemNodePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: false },
  })
  try {
    await removeFileSystemNode(directoryUrl, { recursive: true })
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
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await removeFileSystemNode(directoryUrl, { recursive: true })
  }
}

// directory with a busy file
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)
  await makeBusyFile(fileInsideDirectoryUrl, async () => {
    await removeFileSystemNode(directoryUrl, { recursive: true })
    const actual = await directoryExists(directoryUrl)
    const expected = false
    assert({ actual, expected })
  })
}

// directory with a file without write permission
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeFile(fileInsideDirectoryUrl)
  await writeFileSystemNodePermissions(fileInsideDirectoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  await removeFileSystemNode(directoryUrl, { recursive: true })
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
  await removeFileSystemNode(rootDir, { recursive: true })
  const actual = await directoryExists(rootDir)
  const expected = false
  assert({ actual, expected })
}
