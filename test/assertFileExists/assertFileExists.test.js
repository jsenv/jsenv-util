import { assert } from "@jsenv/assert"
import { assertFileExists, urlToFileSystemPath } from "../../index.js"

const whateverFileUrl = import.meta.resolve("./whatever.js")
try {
  await assertFileExists(whateverFileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`file not found at ${urlToFileSystemPath(whateverFileUrl)}`)
  assert({ actual, expected })
}

const directoryUrl = import.meta.resolve("./fixtures/")
try {
  await assertFileExists(directoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `file expected at ${urlToFileSystemPath(directoryUrl)} and found directory instead`,
  )
  assert({ actual, expected })
}

{
  const fileUrl = import.meta.resolve("./fixtures/file.js")
  const actual = await assertFileExists(fileUrl)
  const expected = undefined
  assert({ actual, expected })
}
