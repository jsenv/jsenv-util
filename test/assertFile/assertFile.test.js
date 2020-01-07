import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  ensureEmptyDirectory,
  assertFile,
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
    await assertFile(sourceUrl)
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
    await assertFile(sourceUrl)
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

  const actual = await assertFile(sourceUrl)
  const expected = undefined
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
