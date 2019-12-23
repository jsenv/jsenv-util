import { assert } from "@jsenv/assert"
import { assertFileExists, urlToFilePath } from "../../index.js"

const whateverFileUrl = import.meta.resolve("./whatever.js")
try {
  await assertFileExists(whateverFileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`file not found at ${urlToFilePath(whateverFileUrl)}`)
  assert({ actual, expected })
}

const directoryUrl = import.meta.resolve("./directory/")
try {
  await assertFileExists(directoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `file expected at ${urlToFilePath(directoryUrl)} and found directory instead`,
  )
  assert({ actual, expected })
}

{
  const fileUrl = import.meta.resolve("./directory/file.js")
  const actual = await assertFileExists(fileUrl)
  const expected = undefined
  assert({ actual, expected })
}