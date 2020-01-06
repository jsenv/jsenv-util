import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  readSymbolicLink,
  copyFileSystemNode,
  resolveUrl,
  writeDirectory,
  writeSymbolicLink,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// link to nothing, destination does not exists
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
  await cleanDirectory(tempDirectoryUrl)
}

// relative link inside root directory move to an other directory
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("other/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)

  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, "./whatever")
  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = "./whatever"
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// relative link outside root directory move to an other directory
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("other/", tempDirectoryUrl)
  const linkSourceUrl = resolveUrl("link", sourceUrl)
  const linkDestinationUrl = resolveUrl("link", destinationUrl)

  await writeDirectory(sourceUrl)
  await writeSymbolicLink(linkSourceUrl, "../whatever")
  await copyFileSystemNode(sourceUrl, destinationUrl)
  const actual = await readSymbolicLink(linkDestinationUrl)
  const expected = "../whatever"
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// absolute link inside root directory move to an other directory
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("other/", tempDirectoryUrl)
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
  await cleanDirectory(tempDirectoryUrl)
}

// absolute link outside root directory move to an other directory
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
  await cleanDirectory(tempDirectoryUrl)
}
