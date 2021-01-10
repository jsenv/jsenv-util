import { assert } from "@jsenv/assert"
import { resolveDirectoryUrl } from "@jsenv/util"

{
  const actual = resolveDirectoryUrl("dir", "file:///directory/")
  const expected = "file:///directory/dir/"
  assert({ actual, expected })
}
