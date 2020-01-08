import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  resolveUrl,
  ensureEmptyDirectory,
  writeFile,
  copyFileSystemNode,
  readFile,
  writeFileSystemNodePermissions,
  writeFileSystemNodeModificationTime,
  readFileSystemNodePermissions,
  readFileSystemNodeModificationTime,
  urlToFileSystemPath,
  writeSymbolicLink,
  readSymbolicLink,
} from "../../index.js"
import { testDirectoryPresence, testFilePresence } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// copy nothing into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`nothing to copy at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// copy file into same file
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(sourceUrl, "coucou")
  try {
    await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy ${urlToFileSystemPath(sourceUrl)} because destination and source are the same`,
    )
    assert({ actual, expected })
  }
}

// copy file into noting
{
  const sourceUrl = resolveUrl("dir/source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/source", tempDirectoryUrl)
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
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy file into file and overwrite disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
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
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy file into file and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeFile(destinationUrl, "bar")

  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = await readFile(destinationUrl)
  const expected = "foo"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy file into directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeDirectory(destinationUrl)

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a file (it's a directory)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy directory into file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(destinationUrl)

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy directory from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a directory (it's a file)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy directory into directory and overwrite disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(destinationUrl)

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy directory from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy directory into directory and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(destinationUrl)

  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    directoryAtSource: await testDirectoryPresence(sourceUrl),
    directoryAtDestination: await testDirectoryPresence(destinationUrl),
  }
  const expected = {
    directoryAtSource: true,
    directoryAtDestination: true,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with content into nothing
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  const fileSourceUrl = resolveUrl("file", sourceUrl)
  const fileDestinationUrl = resolveUrl("file", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileSourceUrl, "foo")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourceContent: await readFile(fileSourceUrl),
    destinationContent: await readFile(fileDestinationUrl),
  }
  const expected = {
    sourceContent: "foo",
    destinationContent: "foo",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with content into directory with content and overwrite enabled
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  const fileASourceUrl = resolveUrl("a.txt", sourceUrl)
  const fileADestinationUrl = resolveUrl("a.txt", destinationUrl)
  const fileBDestinationUrl = resolveUrl("b.txt", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileASourceUrl, "sourceA")
  await writeDirectory(destinationUrl)
  await writeFile(fileADestinationUrl, "destinationA")
  await writeFile(fileBDestinationUrl, "destinationB")

  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    fileASourceContent: await readFile(fileASourceUrl),
    fileADestinationContent: await readFile(fileADestinationUrl),
    fileBDestinationPresent: await testFilePresence(fileBDestinationUrl),
  }
  const expected = {
    fileASourceContent: "sourceA",
    fileADestinationContent: "sourceA",
    fileBDestinationPresent: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy link into nothing
{
  const sourceUrl = resolveUrl("link", tempDirectoryUrl)
  const destinationUrl = resolveUrl("link-renamed", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourceTarget: await readSymbolicLink(sourceUrl),
    destinationTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    sourceTarget: "./whatever",
    destinationTarget: "./whatever",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with relative link targeting node inside into nothing
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, "./whatever")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = "./whatever"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with relative link targeting node outside into nothing
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, "../whatever")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = "../whatever"
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with absolute link inside into nothing
{
  const sourceUrl = resolveUrl("source/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)
  const insideSourceUrl = resolveUrl("file", sourceUrl)
  const insideDestinationUrl = resolveUrl("file", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, insideSourceUrl)

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = insideDestinationUrl
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy directory with absolute link absolute link outside into nothing
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("other/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, tempDirectoryUrl)

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = tempDirectoryUrl
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
