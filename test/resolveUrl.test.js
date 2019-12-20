import { assert } from "@jsenv/assert"
import { resolveUrl } from "../index.js"

{
  const actual = resolveUrl("./file.js", "file:///directory/")
  const expected = "file:///directory/file.js"
  assert({ actual, expected })
}
