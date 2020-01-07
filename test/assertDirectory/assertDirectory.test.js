import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  ensureEmptyDirectory,
  assertDirectory,
  urlToFileSystemPath,
  writeFile,
  writeDirectory,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

// on nothing
{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  try {
    await assertDirectory(sourceUrl)
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
    await assertDirectory(sourceUrl)
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

  const actual = await assertDirectory(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
