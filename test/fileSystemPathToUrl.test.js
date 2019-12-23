import { assert } from "@jsenv/assert"
import { fileSystemPathToUrl } from "../index.js"

{
  const actual = fileSystemPathToUrl("/Users/file.js")
  const expected = "file:///Users/file.js"
  assert({ actual, expected })
}

try {
  fileSystemPathToUrl("file:///Users/file.js")
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`received an invalid value for fileSystemPath: file:///Users/file.js`)
  assert({ actual, expected })
}
