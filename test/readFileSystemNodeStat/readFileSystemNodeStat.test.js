import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  writeDirectory,
  writeFile,
  resolveUrl,
  readFileSystemNodeStat,
  writeFileSystemNodePermissions,
  writeSymbolicLink,
  urlToFileSystemPath,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)

  try {
    await readFileSystemNodeStat(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `ENOENT: no such file or directory, stat '${urlToFileSystemPath(sourceUrl)}'`,
    )
    expected.errno = -2
    expected.code = "ENOENT"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(sourceUrl)
    assert({ actual, expected })
  }
}

// nothing with nullIfNotFound
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)

  const actual = await readFileSystemNodeStat(sourceUrl, { nullIfNotFound: true })
  const expected = null
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// directory without permission
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read: false, write: false, execute: false },
  })

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = typeof sourceStats
  const expected = "object"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// file without permission
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl, "coucou")
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read: false, write: false, execute: false },
  })

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = typeof sourceStats
  const expected = "object"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// busy file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await makeBusyFile(sourceUrl, async () => {
    const sourceStats = await readFileSystemNodeStat(sourceUrl)
    const actual = typeof sourceStats
    const expected = "object"
    assert({ actual, expected })
  })
}

// file inside directory without execute or read permission
{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const sourceUrl = resolveUrl("source", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(sourceUrl)
  await writeFileSystemNodePermissions(directoryUrl, {
    owner: { read: false, write: false, execute: false },
  })

  try {
    await readFileSystemNodeStat(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `EACCES: permission denied, stat '${urlToFileSystemPath(sourceUrl)}'`,
    )
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(sourceUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, execute: true },
    })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = typeof sourceStats
  const expected = "object"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// normal file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = typeof sourceStats
  const expected = "object"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  try {
    await readFileSystemNodeStat(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `ENOENT: no such file or directory, stat '${urlToFileSystemPath(sourceUrl)}'`,
    )
    expected.errno = -2
    expected.code = "ENOENT"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(sourceUrl)
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// link to directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(sourceUrl, "./dir")

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = sourceStats.isDirectory()
  const expected = true
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// link to file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  await writeSymbolicLink(sourceUrl, "./file")

  const sourceStats = await readFileSystemNodeStat(sourceUrl)
  const actual = sourceStats.isFile()
  const expected = true
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// link to nothing with followSymlink disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  const sourceStats = await readFileSystemNodeStat(sourceUrl, { followSymbolicLink: false })
  const actual = sourceStats.isSymbolicLink()
  const expected = true
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// link to directory with followSymlink disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(sourceUrl, "./dir")

  const sourceStats = await readFileSystemNodeStat(sourceUrl, { followSymbolicLink: false })
  const actual = sourceStats.isSymbolicLink()
  const expected = true
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// link to file with followSymlink disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  await writeSymbolicLink(sourceUrl, "./file")

  const sourceStats = await readFileSystemNodeStat(sourceUrl, { followSymbolicLink: false })
  const actual = sourceStats.isSymbolicLink()
  const expected = true
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
