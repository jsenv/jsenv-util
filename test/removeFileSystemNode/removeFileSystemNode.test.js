import { assert } from "@jsenv/assert"
import {
  removeFileSystemNode,
  ensureEmptyDirectory,
  writeFile,
  resolveUrl,
  writeDirectory,
  writeFileSystemNodePermissions,
  urlToFileSystemPath,
  writeSymbolicLink,
  testFileSystemNodePresence,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// remove nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)

  try {
    await removeFileSystemNode(sourceUrl)
  } catch (actual) {
    const expected = new Error(`nothing to remove at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// remove nothing and allowUseless enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)

  const actual = await removeFileSystemNode(sourceUrl, { allowUseless: true })
  const expected = undefined
  assert({ actual, expected })
}

// remove opened filed
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await makeBusyFile(sourceUrl, async () => {
    await removeFileSystemNode(sourceUrl)
    const actual = await testFileSystemNodePresence(sourceUrl)
    const expected = false
    assert({ actual, expected })
  })
}

// remove file inside a directory without execute permission
{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const sourceUrl = resolveUrl("dir/link", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(sourceUrl, "whatever")
  await writeFileSystemNodePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: false },
  })

  try {
    await removeFileSystemNode(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `EACCES: permission denied, lstat '${urlToFileSystemPath(sourceUrl)}'`,
    )
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "lstat"
    expected.path = urlToFileSystemPath(sourceUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// remove file without permission
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl, "noperm")
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read: false, write: false, execute: false },
  })

  await removeFileSystemNode(sourceUrl)
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl, "normal")

  await removeFileSystemNode(sourceUrl)
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove destination with trailing slash being a file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const sourceUrlWithTrailingSlash = `${sourceUrl}/`
  await writeFile(sourceUrl, "trailing")

  await removeFileSystemNode(sourceUrlWithTrailingSlash)
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  await removeFileSystemNode(sourceUrl)
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove directory without permission
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFileSystemNodePermissions(sourceUrl, {
    other: { read: false, write: false, execute: false },
  })

  await removeFileSystemNode(sourceUrl)
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove directory with a file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileUrl)

  try {
    await removeFileSystemNode(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `ENOTEMPTY: directory not empty, rmdir '${urlToFileSystemPath(`${sourceUrl}/`)}'`,
    )
    expected.errno = -66
    expected.code = "ENOTEMPTY"
    expected.syscall = "rmdir"
    expected.path = urlToFileSystemPath(`${sourceUrl}/`)
    assert({ actual, expected })
  } finally {
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// remove directory with a file and recursive enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileUrl)

  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove directory with content without permission and recursive enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileUrl)
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read: true, write: true, execute: false },
  })

  try {
    await removeFileSystemNode(sourceUrl, { recursive: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`EACCES: permission denied, lstat '${urlToFileSystemPath(fileUrl)}'`)
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "lstat"
    expected.path = urlToFileSystemPath(fileUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(sourceUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// remove directory with a busy file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  await makeBusyFile(fileUrl, async () => {
    await removeFileSystemNode(sourceUrl, { recursive: true })
    const actual = await testFileSystemNodePresence(sourceUrl)
    const expected = false
    assert({ actual, expected })
  })
}

// remove directory with a file without write permission
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeFile(fileUrl)
  await writeFileSystemNodePermissions(fileUrl, {
    owner: { read: false, write: false, execute: false },
  })

  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove directory with file nested and recursive enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileAUrl = resolveUrl("source/dir/file", tempDirectoryUrl)
  const fileBUrl = resolveUrl("source/dir2/file", tempDirectoryUrl)
  await writeFile(fileAUrl, "contentA")
  await writeFile(fileBUrl, "contentB")

  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
}

// remove link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  await removeFileSystemNode(sourceUrl)
  const actual = await testFileSystemNodePresence(sourceUrl, {
    followSymbolicLink: false,
  })
  const expected = false
  assert({ actual, expected })
}

// remove directory with a link to nothing
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const linkUrl = resolveUrl("source/link", tempDirectoryUrl)
  await writeSymbolicLink(linkUrl, "./whatever")

  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(sourceUrl, {
    followSymbolicLink: false,
  })
  const expected = false
  assert({ actual, expected })
}

// remove link to a file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", tempDirectoryUrl)
  const linkTarget = "./file.txt"
  await writeSymbolicLink(linkUrl, linkTarget)
  await writeFile(sourceUrl)

  await removeFileSystemNode(linkUrl)
  const actual = {
    filePresent: await testFileSystemNodePresence(sourceUrl),
    linkPresent: await testFileSystemNodePresence(linkUrl, { followSymbolicLink: false }),
  }
  const expected = {
    filePresent: true,
    linkPresent: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// remove link to a directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", tempDirectoryUrl)
  const linkTarget = "./dir"
  await writeSymbolicLink(linkUrl, linkTarget)
  await writeDirectory(sourceUrl)

  await removeFileSystemNode(linkUrl)
  const actual = {
    filePresent: await testFileSystemNodePresence(sourceUrl),
    linkPresent: await testFileSystemNodePresence(linkUrl, { followSymbolicLink: false }),
  }
  const expected = {
    filePresent: true,
    linkPresent: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// remove directory without execute permission and link inside
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const linkUrl = resolveUrl("source/link", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkUrl, "whatever")
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: { read: true, write: true, execute: false },
  })

  try {
    await removeFileSystemNode(sourceUrl, { recursive: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`EACCES: permission denied, lstat '${urlToFileSystemPath(linkUrl)}'`)
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "lstat"
    expected.path = urlToFileSystemPath(linkUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(sourceUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}
