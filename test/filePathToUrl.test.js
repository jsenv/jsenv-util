import { assert } from "@jsenv/assert"
import { fileSystemPathToUrl } from "../index.js"

{
  const actual = fileSystemPathToUrl("/Users/file.js")
  const expected = "file:///Users/file.js"
  assert({ actual, expected })
}

{
  const actual = fileSystemPathToUrl("file:///Users/file.js")
  const expected = "file:///Users/file.js"
  assert({ actual, expected })
}
