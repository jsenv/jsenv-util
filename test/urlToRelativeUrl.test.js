import { assert } from "@jsenv/assert"
import { urlToRelativeUrl } from "../index.js"

{
  const actual = urlToRelativeUrl("file:///directory/foo/file.js", "file:///directory/file.js")
  const expected = "file:///directory/foo/file.js"
  assert({ actual, expected })
}

{
  const actual = urlToRelativeUrl("file:///directory/file.js", "file:///directory/foo/file.js")
  const expected = "file:///directory/file.js"
  assert({ actual, expected })
}

{
  const actual = urlToRelativeUrl("file:///directory/file.js", "file:///directory/")
  const expected = "file.js"
  assert({ actual, expected })
}
