import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  resolveUrl,
  cleanDirectory,
  writeFile,
  copyFileSystemNode,
  readFile,
  urlToFileSystemPath,
  testFileSystemNodePresence,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// destination does not exists
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir-renamed/", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationPresence: await testFileSystemNodePresence(destinationUrl),
  }
  const expected = {
    sourcePresence: true,
    destinationPresence: true,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// destination is a file
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file.txt", tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a directory and overwrite disabled
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir-moved/", tempDirectoryUrl)
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
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a directory and overwrite enabled
{
  const sourceUrl = resolveUrl("dir", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir-moved/", tempDirectoryUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(destinationUrl)
  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    sourcePresence: await testFileSystemNodePresence(sourceUrl),
    destinationPresence: await testFileSystemNodePresence(destinationUrl),
  }
  const expected = {
    sourcePresence: true,
    destinationPresence: true,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// source has content
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir-moved/", tempDirectoryUrl)
  const fileSourceUrl = resolveUrl("file.txt", sourceUrl)
  const fileDestinationUrl = resolveUrl("file.txt", destinationUrl)
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
  await cleanDirectory(tempDirectoryUrl)
}

// source and destination have content
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir-moved/", tempDirectoryUrl)
  const fileASourceUrl = resolveUrl("a.txt", sourceUrl)
  const fileADestinationUrl = resolveUrl("a.txt", destinationUrl)
  const fileBDestinationUrl = resolveUrl("b.txt", destinationUrl)
  await writeDirectory(sourceUrl)
  await writeDirectory(destinationUrl)
  await writeFile(fileASourceUrl, "sourceA")
  await writeFile(fileADestinationUrl, "destinationA")
  await writeFile(fileBDestinationUrl, "destinationB")
  await copyFileSystemNode(sourceUrl, destinationUrl, { overwrite: true })
  const actual = {
    fileASourceContent: await readFile(fileASourceUrl),
    fileADestinationContent: await readFile(fileADestinationUrl),
    fileBDestinationPresent: await testFileSystemNodePresence(fileBDestinationUrl),
  }
  const expected = {
    fileASourceContent: "sourceA",
    fileADestinationContent: "sourceA",
    fileBDestinationPresent: false,
  }
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}
