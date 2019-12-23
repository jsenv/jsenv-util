import { assert } from "@jsenv/assert"
import { urlToFileSystemPath } from "../index.js"

{
  const actual = urlToFileSystemPath("file:///directory/file.js")
  const expected = "/directory/file.js"
  assert({ actual, expected })
}

try {
  urlToFileSystemPath("http://example.com/directory/file.js")
  throw new Error("should throw")
} catch (error) {
  const actual = { code: error.code, name: error.name, message: error.message }
  const expected = {
    code: "ERR_INVALID_URL_SCHEME",
    name: "TypeError",
    message: "The URL must be of scheme file",
  }
  assert({ actual, expected })
}
