import { assert } from "@jsenv/assert"
import { urlsHaveSameOrigin } from "../index.js"

{
  const actual = urlsHaveSameOrigin(
    "http://example.com/directory/file.js",
    "http://example.fr/directory/file.js",
  )
  const expected = false
  assert({ actual, expected })
}

{
  const actual = urlsHaveSameOrigin(
    "http://example.com/directory/file.js",
    "http://example.com/index.js",
  )
  const expected = true
  assert({ actual, expected })
}
