import { assert } from "@jsenv/assert"
import { urlToRelativePath } from "../index.js"

{
  const actual = urlToRelativePath("file:///directory/foo/file.js", "file:///directory/file.js")
  const expected = "foo/file.js"
  assert({ actual, expected })
}

{
  const actual = urlToRelativePath("file:///directory/file.js", "file:///directory/foo/file.js")
  const expected = "../file.js"
  assert({ actual, expected })
}
