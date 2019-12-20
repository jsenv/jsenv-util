import { assert } from "@jsenv/assert"
import { filePathToUrl } from "../index.js"

{
  const actual = filePathToUrl("/Users/file.js")
  const expected = "file:///Users/file.js"
  assert({ actual, expected })
}

{
  const actual = filePathToUrl("file:///Users/file.js")
  const expected = "file:///Users/file.js"
  assert({ actual, expected })
}
