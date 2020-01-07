import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  writeDirectory,
  cleanDirectory,
  writeParentDirectories,
  testFileSystemNodePresence,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// destination parent does not exists
{
  const parentDirectoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir/file.js", tempDirectoryUrl)

  await writeParentDirectories(destinationUrl)
  const actual = await testFileSystemNodePresence(parentDirectoryUrl)
  const expected = true
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}

// destination parent is a directory
{
  const parentDirectoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dir/file.js", tempDirectoryUrl)
  await writeDirectory(parentDirectoryUrl)

  await writeParentDirectories(destinationUrl)
  const actual = await testFileSystemNodePresence(parentDirectoryUrl)
  const expected = true
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}
