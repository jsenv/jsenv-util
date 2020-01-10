import { assert } from "@jsenv/assert"
import {
  urlToFileSystemPath,
  ensureEmptyDirectory,
  resolveUrl,
  writeDirectory,
  writeFile,
  readDirectory,
  writeSymbolicLink,
  writeFileSystemNodePermissions,
  writeFileSystemNodeModificationTime,
  readFileSystemNodePermissions,
  readFileSystemNodeModificationTime,
} from "../../index.js"

const isWindows = process.platform === "win32"
const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// on nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)

  await ensureEmptyDirectory(sourceUrl)
  const actual = await readDirectory(sourceUrl)
  const expected = []
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// on directory with a file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileUrl)

  await ensureEmptyDirectory(sourceUrl)
  const actual = await readDirectory(sourceUrl)
  const expected = []
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// on file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl)

  try {
    await ensureEmptyDirectory(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `ensureEmptyDirectory expect directory at ${urlToFileSystemPath(
        sourceUrl,
      )}, found file instead`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// on symlink to directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(sourceUrl, "./dir")

  try {
    await ensureEmptyDirectory(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `ensureEmptyDirectory expect directory at ${urlToFileSystemPath(
        sourceUrl,
      )}, found symbolic-link instead`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// directory permissions preserved (mtime cannot when there is a file inside)
if (!isWindows) {
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  const permissions = {
    owner: { read: true, write: true, execute: true },
    group: { read: false, write: false, execute: true },
    others: { read: false, write: false, execute: false },
  }
  const mtime = Date.now()
  await writeDirectory(sourceUrl)
  await writeFile(fileUrl)
  await writeFileSystemNodePermissions(sourceUrl, permissions)
  await writeFileSystemNodeModificationTime(sourceUrl, mtime)

  await ensureEmptyDirectory(sourceUrl)
  const permissionsAfter = await readFileSystemNodePermissions(sourceUrl)
  const mtimeAfter = await readFileSystemNodeModificationTime(sourceUrl)
  const actual = {
    permissions: permissionsAfter,
    mtimeModified: mtimeAfter !== mtime,
  }
  const expected = {
    permissions,
    mtimeModified: true,
  }
  assert({ actual, expected })
}
