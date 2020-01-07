import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  ensureEmptyDirectory,
  assertDirectoryPresence,
  urlToFileSystemPath,
  writeFile,
  writeDirectory,
  writeSymbolicLink,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// on nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  try {
    await assertDirectoryPresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`directory not found at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// on file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl)

  try {
    await assertDirectoryPresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `directory expected at ${urlToFileSystemPath(sourceUrl)} and found file instead`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// on directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  const actual = await assertDirectoryPresence(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// on symlink to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./file")

  try {
    await assertDirectoryPresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`directory not found at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// on symlink to directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeSymbolicLink(sourceUrl, "./dir")

  const actual = await assertDirectoryPresence(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
