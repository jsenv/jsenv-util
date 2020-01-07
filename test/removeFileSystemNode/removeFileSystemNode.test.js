import { assert } from "@jsenv/assert"
import {
  removeFileSystemNode,
  cleanDirectory,
  fileExists,
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
  const fileUrl = resolveUrl("link", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileUrl, "whatever")
  await writeFileSystemNodePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: false },
  })

  try {
    await removeFileSystemNode(fileUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`EACCES: permission denied, stat '${urlToFileSystemPath(fileUrl)}'`)
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(fileUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await removeFileSystemNode(directoryUrl, { recursive: true })
  }
}

// file without permission
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  await writeFile(fileUrl, "noperm")
  await writeFileSystemNodePermissions(fileUrl, {
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

// empty directory
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  await writeDirectory(directoryUrl)

  await removeFileSystemNode(directoryUrl)
  const actual = await testFileSystemNodePresence(directoryUrl)
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
  const actual = await testFileSystemNodePresence(directoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
  }
}

// directory with content and recursive enabled
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileInsideDirectoryUrl)

  await removeFileSystemNode(directoryUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(directoryUrl)
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
      `EACCES: permission denied, stat '${urlToFileSystemPath(fileInsideDirectoryUrl)}'`,
    )
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(fileInsideDirectoryUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await cleanDirectory(tempDirectoryUrl, { recursive: true })
  }
}

// directory with a busy file
{
  const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
  const fileInsideDirectoryUrl = resolveUrl("file.txt", directoryUrl)
  await writeDirectory(directoryUrl)

  await makeBusyFile(fileInsideDirectoryUrl, async () => {
    await removeFileSystemNode(directoryUrl, { recursive: true })
    const actual = await testFileSystemNodePresence(directoryUrl)
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
  const actual = await testFileSystemNodePresence(directoryUrl)
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
  const actual = await testFileSystemNodePresence(rootDir)
  const expected = false
  assert({ actual, expected })
}

// link to nothing
{
  const symbolicLinkUrl = resolveUrl("link", tempDirectoryUrl)
  await writeSymbolicLink(symbolicLinkUrl, "./whatever")
  await removeFileSystemNode(symbolicLinkUrl)
  const actual = await testFileSystemNodePresence(symbolicLinkUrl, {
    followSymbolicLink: false,
  })
  const expected = false
  assert({ actual, expected })
}

// link to nothing inside a dir
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", sourceUrl)
  await writeSymbolicLink(linkUrl, "./whatever")
  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await testFileSystemNodePresence(sourceUrl, {
    followSymbolicLink: false,
  })
  const expected = false
  assert({ actual, expected })
}

// link to an existing file
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", tempDirectoryUrl)
  const linkTarget = "./file.txt"
  await writeSymbolicLink(linkUrl, linkTarget)
  await writeFile(fileUrl)
  await removeFileSystemNode(linkUrl)
  const actual = {
    filePresent: await testFileSystemNodePresence(fileUrl),
    linkPresent: await testFileSystemNodePresence(linkUrl, { followSymbolicLink: false }),
  }
  const expected = {
    filePresent: true,
    linkPresent: false,
  }
  assert({ actual, expected })
  await removeFileSystemNode(fileUrl)
}

// link to an existing directory
{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", tempDirectoryUrl)
  const linkTarget = "./dir"
  await writeSymbolicLink(linkUrl, linkTarget)
  await writeDirectory(directoryUrl)
  await removeFileSystemNode(linkUrl)
  const actual = {
    filePresent: await testFileSystemNodePresence(directoryUrl),
    linkPresent: await testFileSystemNodePresence(linkUrl, { followSymbolicLink: false }),
  }
  const expected = {
    filePresent: true,
    linkPresent: false,
  }
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
}

// link inside a directory without execute permission
{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(linkUrl, "whatever")
  await writeFileSystemNodePermissions(directoryUrl, {
    owner: { read: true, write: true, execute: false },
  })

  try {
    await removeFileSystemNode(linkUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`EACCES: permission denied, stat '${urlToFileSystemPath(linkUrl)}'`)
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "stat"
    expected.path = urlToFileSystemPath(linkUrl)
    assert({ actual, expected })
  } finally {
    await writeFileSystemNodePermissions(directoryUrl, {
      owner: { read: true, write: true, execute: true },
    })
    await removeFileSystemNode(directoryUrl, { recursive: true })
  }
}
