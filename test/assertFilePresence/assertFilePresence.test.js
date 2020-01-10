import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  ensureEmptyDirectory,
  assertFilePresence,
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
    await assertFilePresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`file not found at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
  }
}

// on directory
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeDirectory(sourceUrl)

  try {
    await assertFilePresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `file expected at ${urlToFileSystemPath(sourceUrl)} and found directory instead`,
    )
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// on file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeFile(sourceUrl)

  const actual = await assertFilePresence(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// on symlink to nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  await writeSymbolicLink(sourceUrl, "./file")

  try {
    await assertFilePresence(sourceUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`file not found at ${urlToFileSystemPath(sourceUrl)}`)
    assert({ actual, expected })
    await ensureEmptyDirectory(tempDirectoryUrl)
  }
}

// on symlink to file
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  await writeSymbolicLink(sourceUrl, "./file")

  const actual = await assertFilePresence(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
