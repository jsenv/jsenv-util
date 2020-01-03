import { assert } from "@jsenv/assert"
import { resolveDirectoryUrl } from "../index.js"

{
  const actual = resolveDirectoryUrl("dir", "file:///directory/")
  const expected = "file:///directory/dir/"
  assert({ actual, expected })
}
