import { assert } from "@jsenv/assert"
import {
  createDirectory,
  fileExists,
  writeFile,
  removeFile,
  resolveUrl,
  writePermissions,
  urlToFileSystemPath,
  removeDirectory,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
const fileInsideDirectoryUrl = resolveUrl("file.js", directoryUrl)
await createDirectory(tempDirectoryUrl)

// file does not exists
{
  await removeFile(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// busy file
await makeBusyFile(fileUrl, async () => {
  await removeFile(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
})

// on a directory
await createDirectory(directoryUrl)
try {
  await removeFile(directoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `EPERM: operation not permitted, unlink '${urlToFileSystemPath(directoryUrl)}'`,
  )
  expected.errno = -1
  expected.code = "EPERM"
  expected.syscall = "unlink"
  expected.path = urlToFileSystemPath(directoryUrl)
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
}

// file inside a directory without execute permission
await createDirectory(directoryUrl)
await writeFile(fileInsideDirectoryUrl, "dirnoperm")
await writePermissions(directoryUrl, {
  owner: { read: true, write: true, execute: false },
})
try {
  await removeFile(fileInsideDirectoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `EACCES: permission denied, unlink '${urlToFileSystemPath(fileInsideDirectoryUrl)}'`,
  )
  expected.errno = -13
  expected.code = "EACCES"
  expected.syscall = "unlink"
  expected.path = urlToFileSystemPath(fileInsideDirectoryUrl)
  assert({ actual, expected })
  await writePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: true },
  })
  await removeDirectory(directoryUrl, { removeContent: true })
}

// file without permission
{
  await writeFile(fileUrl, "noperm")
  await writePermissions(fileUrl, {
    owner: { read: false, write: false, execute: false },
  })
  await removeFile(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// normal file
{
  await writeFile(fileUrl, "normal")
  await removeFile(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// normal file with trailing slash
await writeFile(fileUrl, "trailing")
const fileUrlWithTrailingSlash = `${fileUrl}/`
try {
  await removeFile(fileUrlWithTrailingSlash)
} catch (actual) {
  const expected = new Error(
    `ENOTDIR: not a directory, unlink '${urlToFileSystemPath(fileUrlWithTrailingSlash)}'`,
  )
  expected.errno = -20
  expected.code = "ENOTDIR"
  expected.syscall = "unlink"
  expected.path = urlToFileSystemPath(fileUrlWithTrailingSlash)
  assert({ actual, expected })
  await removeFile(fileUrl)
}
