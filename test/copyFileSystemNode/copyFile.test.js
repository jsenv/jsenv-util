import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  resolveUrl,
  cleanDirectory,
  writeFile,
  copyFileSystemNode,
  readFile,
  writeFileSystemNodePermissions,
  writeFileSystemNodeModificationTime,
  readFileSystemNodePermissions,
  readFileSystemNodeModificationTime,
  urlToFileSystemPath,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// source does not exists
{
  const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const fileDestinationUrl = resolveUrl("file-moved.txt", tempDirectoryUrl)
  try {
    await copyFileSystemNode(fileUrl, fileDestinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`nothing to copy at ${urlToFileSystemPath(fileUrl)}`)
    assert({ actual, expected })
  }
}

// destination does not exists
{
  const sourceUrl = resolveUrl("dir/file.txt", tempDirectoryUrl)
  const destinationUrl = resolveUrl("other/file.txt", tempDirectoryUrl)
  const sourceContent = "hello"
  const sourceMtime = Date.now()
  const sourcePermissions = {
    owner: { read: true, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    others: { read: false, write: false, execute: false },
  }

  await writeFile(sourceUrl, "hello")
  await writeFileSystemNodePermissions(sourceUrl, sourcePermissions)
  await writeFileSystemNodeModificationTime(sourceUrl, sourceMtime)
  await copyFileSystemNode(sourceUrl, destinationUrl)

  const actual = {
    sourceContent: await readFile(sourceUrl),
    sourcePermissions: await readFileSystemNodePermissions(sourceUrl),
    sourceMtime: await readFileSystemNodeModificationTime(sourceUrl),
    destinationContent: await readFile(destinationUrl),
    destinationPermissions: await readFileSystemNodePermissions(destinationUrl),
    destinationMtime: await readFileSystemNodeModificationTime(destinationUrl),
  }
  const expected = {
    sourceContent,
    sourcePermissions: {
      owner: { ...sourcePermissions.owner },
      group: { ...sourcePermissions.group },
      others: { ...sourcePermissions.others },
    },
    sourceMtime,
    destinationContent: sourceContent,
    destinationPermissions: sourcePermissions,
    destinationMtime: sourceMtime,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// destination is a file and overwrite disabled
{
  const sourceUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file.txt", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeFile(destinationUrl)
  try {
    await copyFileSystemNode(sourceUrl, destinationUrl)
  } catch (actual) {
    const expected = new Error(
      `cannot copy file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a file and overwrite enabled
{
  const sourceUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file-moved.txt", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeFile(destinationUrl, "bar")
  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = await readFile(destinationUrl)
  const expected = "foo"
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// destination is a directory
{
  const sourceUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeDirectory(destinationUrl)
  try {
    await copyFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a file (it's a directory)`,
    )
    assert({ actual, expected })
  }
}
