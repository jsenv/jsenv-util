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
await writeFile(fileInsideDirectoryUrl, "coucou")
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
    owner: { read: true, execute: true },
  })
  await removeDirectory(directoryUrl, { removeContent: true })
}

// file without permission
{
  await writeFile(fileUrl, "coucou")
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
  await writeFile(fileUrl, "coucou")
  await removeFile(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}
