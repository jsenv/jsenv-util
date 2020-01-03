import { assert } from "@jsenv/assert"
import { resolveUrl } from "../index.js"

{
  const actual = resolveUrl("./file.js", "file:///directory/")
  const expected = "file:///directory/file.js"
  assert({ actual, expected })
}

try {
  resolveUrl("./foo.js")
  throw new Error("should throw")
} catch (actual) {
  const expected = new TypeError(`baseUrl missing`)
  assert({ actual, expected })
}
