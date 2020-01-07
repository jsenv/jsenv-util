import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  resolveUrl,
  writeSymbolicLink,
  testFileSystemNodePresence,
  writeFile,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// link to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = false
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// link to file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./file")
  await writeFile(fileUrl)

  const actual = await testFileSystemNodePresence(sourceUrl)
  const expected = true
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// link to nothing and followSymlink disabled
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./whatever")

  const actual = await testFileSystemNodePresence(sourceUrl, { followSymbolicLink: false })
  const expected = true
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}
