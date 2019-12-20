import { assert } from "@jsenv/assert"
import { urlToFilePath } from "../index.js"

{
  const actual = urlToFilePath("file:///directory/file.js")
  const expected = "/directory/file.js"
  assert({ actual, expected })
}

try {
  urlToFilePath("http://example.com/directory/file.js")
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
