import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  readFileSystemNodeStat,
  removeFileSystemNode,
  resolveUrl,
  writeDirectory,
  writeFile,
  writeSymbolicLink,
  testFileSystemNodePresence,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// link to nothing
{
  const symbolicLinkUrl = resolveUrl("link", tempDirectoryUrl)
  await writeSymbolicLink(symbolicLinkUrl, "./whatever")
  await removeFileSystemNode(symbolicLinkUrl)
  const actual = await readFileSystemNodeStat(symbolicLinkUrl, {
    nullIfNotFound: true,
    followSymbolicLink: false,
  })
  const expected = null
  assert({ actual, expected })
}

// link to nothing inside a dir
{
  const sourceUrl = resolveUrl("dir/", tempDirectoryUrl)
  const linkUrl = resolveUrl("link", sourceUrl)
  await writeSymbolicLink(linkUrl, "./whatever")
  await removeFileSystemNode(sourceUrl, { recursive: true })
  const actual = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followSymbolicLink: false,
  })
  const expected = null
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
    linkPresent: await testFileSystemNodePresence(linkUrl),
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
    linkPresent: await testFileSystemNodePresence(linkUrl),
  }
  const expected = {
    filePresent: true,
    linkPresent: false,
  }
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
}
