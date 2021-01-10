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
} from "@jsenv/util"
import { ensureUrlTrailingSlash } from "@jsenv/util/src/internal/ensureUrlTrailingSlash.js"
import {
  testDirectoryPresence,
  testFilePresence,
  toSecondsPrecision,
} from "@jsenv/util/test/testHelpers.js"

const isWindows = process.platform === "win32"
const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)
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
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl)

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy ${urlToFileSystemPath(sourceUrl)} because destination and source are the same`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy file into nothing
{
  const sourceUrl = resolveUrl("source/file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest/file", tempDirectoryUrl)
  const sourceContent = "hello"
  const sourceMtime = toSecondsPrecision(Date.now())
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
    sourceMtime: toSecondsPrecision(await readFileSystemNodeModificationTime(sourceUrl)),
    destinationContent: await readFile(destinationUrl),
    destinationMtime: toSecondsPrecision(await readFileSystemNodeModificationTime(destinationUrl)),
  }
  const expected = {
    sourceContent,
    sourceMtime,
    destinationContent: sourceContent,
    destinationMtime: sourceMtime,
  }
  assert({ actual, expected })
  // on windows permissions are not reliable
  if (!isWindows) {
    const actual = {
      sourcePermissions: await readFileSystemNodePermissions(sourceUrl),
      destinationPermissions: await readFileSystemNodePermissions(destinationUrl),
    }
    const expected = {
      sourcePermissions: {
        owner: { ...sourcePermissions.owner },
        group: { ...sourcePermissions.group },
        others: { ...sourcePermissions.others },
      },
      destinationPermissions: sourcePermissions,
    }
    assert({ actual, expected })
  }
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
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileASourceUrl = resolveUrl("source/a.txt", tempDirectoryUrl)
  const fileADestinationUrl = resolveUrl("dest/a.txt", tempDirectoryUrl)
  const fileBDestinationUrl = resolveUrl("dest/b.txt", tempDirectoryUrl)
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

// copy directory with relative link targeting node inside into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("source/link", tempDirectoryUrl)
  const linkDestinationUrl = resolveUrl("dest/link", tempDirectoryUrl)
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
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("source/link", tempDirectoryUrl)
  const linkDestinationUrl = resolveUrl("dest/link", tempDirectoryUrl)
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
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("source/link", tempDirectoryUrl)
  const linkDestinationUrl = resolveUrl("dest/link", tempDirectoryUrl)
  const insideSourceUrl = resolveUrl("source/file", tempDirectoryUrl)
  const insideDestinationUrl = resolveUrl("dest/file", tempDirectoryUrl)
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
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("source/link", tempDirectoryUrl)
  const linkDestinationUrl = resolveUrl("dest/link", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, tempDirectoryUrl)

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = ensureUrlTrailingSlash(await readSymbolicLink(linkDestinationUrl))
  const expected = tempDirectoryUrl
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy link into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
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

// copy link to nothing into link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileUrl = resolveUrl("desttarget", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./sourcetarget")
  await writeSymbolicLink(destinationUrl, "./desttarget")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourceLinkTarget: await readSymbolicLink(sourceUrl),
    destinationLinkTarget: await readSymbolicLink(destinationUrl),
    linkTarget: await readSymbolicLink(fileUrl),
  }
  const expected = {
    sourceLinkTarget: "./sourcetarget",
    destinationLinkTarget: "./desttarget",
    linkTarget: "./sourcetarget",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy link to nothing into link to nothing with followLink disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")
  await writeSymbolicLink(destinationUrl, "./whatever")

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl, { followLink: false })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy symbolic-link from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// copy link to nothing into link to nothing with followLink disabled and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const sourceLinkTarget = "./sourcetarget"
  const destinationLinkTarget = "./destinationtarget"
  await writeSymbolicLink(sourceUrl, sourceLinkTarget)
  await writeSymbolicLink(destinationUrl, destinationLinkTarget)

  await copyFileSystemNode(sourceUrl, destinationUrl, {
    followLink: false,
    overwrite: true,
  })
  const actual = {
    sourceLinkTarget: await readSymbolicLink(sourceUrl),
    destinationLinkTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    sourceLinkTarget,
    destinationLinkTarget: sourceLinkTarget,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy file into link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeSymbolicLink(destinationUrl, "./file")

  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourceContent: await readFile(sourceUrl),
    destinationLinkTarget: await readSymbolicLink(destinationUrl),
    fileContent: await readFile(fileUrl),
  }
  const expected = {
    sourceContent: "foo",
    destinationLinkTarget: "./file",
    fileContent: "foo",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// copy file into link to same file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeSymbolicLink(destinationUrl, "./source")

  try {
    await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot copy ${urlToFileSystemPath(sourceUrl)} because destination and source are the same`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}
