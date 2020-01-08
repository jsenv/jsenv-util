import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  resolveUrl,
  writeDirectory,
  writeFile,
  moveFileSystemNode,
  readFile,
  readSymbolicLink,
  urlToFileSystemPath,
  writeSymbolicLink,
} from "../../index.js"
import {
  testFilePresence,
  testSymbolicLinkPresence,
  testDirectoryPresence,
} from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// move nothing into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`nothing to move from ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// move link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`nothing to move from ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into same destination
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl, "coucou")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `no move needed for ${urlToFileSystemPath(
        sourceUrl,
      )} because destination and source are the same`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into link to same destination
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeSymbolicLink(destinationUrl, "./source")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `no move needed for ${urlToFileSystemPath(
        sourceUrl,
      )} because destination and source are the same`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")

  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFilePresence(sourceUrl),
    destinationContent: await readFile(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationContent: "foo",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move file into link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileUrl = resolveUrl("whatever", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await writeSymbolicLink(destinationUrl, "./whatever")

  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFilePresence(sourceUrl),
    fileContent: await readFile(fileUrl),
    destinationContent: await readFile(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    fileContent: "foo",
    destinationContent: "foo",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move file into file and overwrite disabled
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file2", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeFile(destinationUrl)
  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into link to file and overwrite disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileUrl = resolveUrl("whatever", tempDirectoryUrl)
  await writeFile(sourceUrl, "content")
  await writeFile(fileUrl, "original")
  await writeSymbolicLink(destinationUrl, "./whatever")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        fileUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into link to file and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const fileUrl = resolveUrl("whatever", tempDirectoryUrl)
  await writeFile(sourceUrl, "content")
  await writeFile(fileUrl, "original")
  await writeSymbolicLink(destinationUrl, "./whatever")

  await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    sourceFilePresence: await testFilePresence(sourceUrl),
    linkPresence: await testSymbolicLinkPresence(destinationUrl),
    fileContent: await readFile(fileUrl),
  }
  const expected = {
    sourceFilePresence: false,
    linkPresence: true,
    fileContent: "content",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move file into directory and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeDirectory(destinationUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a file (it's a directory)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into link to directory and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeSymbolicLink(destinationUrl, "./dir")
  await writeDirectory(directoryUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        directoryUrl,
      )} because destination exists and is not a file (it's a directory)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move file into file and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const sourceContent = "foo"
  await writeFile(sourceUrl, sourceContent)
  await writeFile(destinationUrl, "bar")

  await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    sourceFilePresence: await testFilePresence(sourceUrl),
    destinationContent: await readFile(destinationUrl),
  }
  const expected = {
    sourceFilePresence: false,
    destinationContent: sourceContent,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move directory into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/dest", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    directoryAtSource: await testDirectoryPresence(sourceUrl),
    directoryAtDestination: await testDirectoryPresence(destinationUrl),
  }
  const expected = {
    directoryAtSource: false,
    directoryAtDestination: true,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move directory into directory and overwrite disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/dest", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(destinationUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move directory from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move directory into link to directory and overwrite disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(destinationUrl, "./dir")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move directory from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        directoryUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move directory into file and overwrite enabled
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/new-name", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeFile(destinationUrl)
  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move directory from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a directory (it's a file)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// move directory and content into directory and overwrite enabled
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/new-name/", tempDirectoryUrl)
  const fileASourceUrl = resolveUrl("filea", sourceUrl)
  const fileADestinationUrl = resolveUrl("filea", destinationUrl)
  const fileBDestinationUrl = resolveUrl("fileb", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeFile(fileASourceUrl, "sourceA")
  await writeDirectory(destinationUrl)
  await writeFile(fileADestinationUrl, "destinationA")
  await writeFile(fileBDestinationUrl, "destinationB")

  await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    fileASourcePresence: await testFilePresence(fileASourceUrl),
    fileADestinationContent: await readFile(fileADestinationUrl),
    fileBDestinationPresence: await testFilePresence(fileBDestinationUrl),
  }
  const expected = {
    fileASourcePresence: false,
    fileADestinationContent: "sourceA",
    fileBDestinationPresence: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// followSymlink disabled: move link to nothing into nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  await moveFileSystemNode(sourceUrl, destinationUrl, { followLink: false })
  const actual = {
    linkAtSource: await testSymbolicLinkPresence(sourceUrl),
    destinationLinkTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    linkAtSource: false,
    destinationLinkTarget: "./whatever",
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// followSymlink disabled: move link to nothing into link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")
  await writeSymbolicLink(destinationUrl, "./whatever")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { followLink: false })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move symbolic-link from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// followSymlink disabled: move link to nothing into link to nothing and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  const sourceTarget = "./whatever"
  const destinationTarget = "./other"
  await writeSymbolicLink(sourceUrl, sourceTarget)
  await writeSymbolicLink(destinationUrl, destinationTarget)

  await moveFileSystemNode(sourceUrl, destinationUrl, {
    followLink: false,
    overwrite: true,
  })
  const actual = {
    sourcePresence: await testFilePresence(sourceUrl),
    destinationTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationTarget: sourceTarget,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// followSymlink disabled: move link to nothing into file and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")
  await writeFile(destinationUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, {
      followLink: false,
      overwrite: true,
    })
  } catch (actual) {
    const expected = new Error(
      `cannot move symbolic-link from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a symbolic-link (it's a file)`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}
