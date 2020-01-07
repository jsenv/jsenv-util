import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  resolveUrl,
  writeDirectory,
  writeFile,
  moveFileSystemNode,
  readFile,
  readSymbolicLink,
  urlToFileSystemPath,
  writeSymbolicLink,
  testFileSystemNodePresence,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// move nothing into nothing
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file2", tempDirectoryUrl)
  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`nothing to move from ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// move file into same destination
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file", tempDirectoryUrl)
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
  }
}

// move file into nothing
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file2", tempDirectoryUrl)
  await writeFile(sourceUrl, "foo")
  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationContent: await readFile(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationContent: "foo",
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
  }
}

// move file into symbolic link and overwrite enabled
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("link", tempDirectoryUrl)
  const fileUrl = resolveUrl("whatever", tempDirectoryUrl)
  await writeFile(sourceUrl)
  await writeFile(fileUrl)
  await writeSymbolicLink(destinationUrl, "./whatever")
  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot move file from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a file (it's a symbolic-link)`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// move file into directory and overwrite enabled
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir", tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
  }
}

// move file into file and overwrite enabled
{
  const sourceUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file2", tempDirectoryUrl)
  const sourceContent = "foo"
  await writeFile(sourceUrl, sourceContent)
  await writeFile(destinationUrl, "bar")

  await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationContent: await readFile(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationContent: sourceContent,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// move directory into nothing
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/new-name", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationPresence: await testFileSystemNodePresence(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationPresence: true,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// move directory into directory and overwrite disabled
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("into/new-name", tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
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
    fileASourcePresence: await testFileSystemNodePresence(fileASourceUrl),
    fileADestinationContent: await readFile(fileADestinationUrl),
    fileBDestinationPresence: await testFileSystemNodePresence(fileBDestinationUrl),
  }
  const expected = {
    fileASourcePresence: false,
    fileADestinationContent: "sourceA",
    fileBDestinationPresence: false,
  }
  assert({ actual, expected })
}

// move link into nothing
{
  const sourceUrl = resolveUrl("link", tempDirectoryUrl)
  const destinationUrl = resolveUrl("link-moved", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  await moveFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationTarget: "./whatever",
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// move link into link and overwrite disabled
{
  const sourceUrl = resolveUrl("link", tempDirectoryUrl)
  const destinationUrl = resolveUrl("link-moved", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")
  await writeSymbolicLink(destinationUrl, "./whatever")

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl)
  } catch (actual) {
    const expected = new Error(
      `cannot move symbolic-link from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and overwrite option is disabled`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// move link into link and overwrite enabled
{
  const sourceUrl = resolveUrl("link", tempDirectoryUrl)
  const destinationUrl = resolveUrl("link-moved", tempDirectoryUrl)
  const sourceTarget = "./whatever"
  const destinationTarget = "./other"
  await writeSymbolicLink(sourceUrl, sourceTarget)
  await writeSymbolicLink(destinationUrl, destinationTarget)

  await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationTarget: await readSymbolicLink(destinationUrl),
  }
  const expected = {
    sourcePresence: false,
    destinationTarget: sourceTarget,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// move link into file and overwrite enabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")
  await writeFile(destinationUrl)

  try {
    await moveFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  } catch (actual) {
    const expected = new Error(
      `cannot move symbolic-link from ${urlToFileSystemPath(sourceUrl)} to ${urlToFileSystemPath(
        destinationUrl,
      )} because destination exists and is not a symbolic-link (it's a file)`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}
