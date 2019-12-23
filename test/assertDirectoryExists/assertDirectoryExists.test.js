import { assert } from "@jsenv/assert"
import { assertDirectoryExists, urlToFileSystemPath } from "../../index.js"

const whateverDirectoryUrl = import.meta.resolve("./whatever/")
try {
  await assertDirectoryExists(whateverDirectoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `directory not found at ${urlToFileSystemPath(whateverDirectoryUrl).slice(0, -1)}`,
  )
  assert({ actual, expected })
}

const fileUrl = import.meta.resolve("./directory/file.js")
try {
  await assertDirectoryExists(fileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `directory expected at ${urlToFileSystemPath(fileUrl)} and found file instead`,
  )
  assert({ actual, expected })
}

{
  const directoryUrl = import.meta.resolve("./directory/")
  const actual = await assertDirectoryExists(directoryUrl)
  const expected = undefined
  assert({ actual, expected })
}
