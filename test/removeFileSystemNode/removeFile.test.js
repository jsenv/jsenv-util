import { assert } from "@jsenv/assert"
import {
  removeFileSystemNode,
  cleanDirectory,
  fileExists,
  writeFile,
  resolveUrl,
  writeDirectory,
  writePermissions,
  urlToFileSystemPath,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// file does not exists
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const actual = await removeFileSystemNode(fileUrl)
  const expected = undefined
  assert({ actual, expected })
}

// file is opened
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  await makeBusyFile(fileUrl, async () => {
    await removeFileSystemNode(fileUrl)
    const actual = await fileExists(fileUrl)
    const expected = false
    assert({ actual, expected })
  })
}

// file inside a directory without execute permission
{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl, "dirnoperm")
  await writePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: false },
  })
  try {
    await removeFileSystemNode(fileInsideDirectoryUrl)
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
    await removeFileSystemNode(directoryUrl, { recursive: true })
  }
}

// file without permission
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  await writeFile(fileUrl, "noperm")
  await writePermissions(fileUrl, {
    owner: { read: false, write: false, execute: false },
  })
  await removeFileSystemNode(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// file
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  await writeFile(fileUrl, "normal")
  await removeFileSystemNode(fileUrl)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// file provided with a trailing slash
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const fileUrlWithTrailingSlash = `${fileUrl}/`
  await writeFile(fileUrl, "trailing")
  await removeFileSystemNode(fileUrlWithTrailingSlash)
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}
