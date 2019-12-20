import { assert } from "@jsenv/assert"
import { assertAndNormalizeDirectoryUrl } from "../index.js"

try {
  assertAndNormalizeDirectoryUrl()
  throw new Error("should throw")
} catch (actual) {
  const expected = new TypeError("directoryUrl must be a string or an url, received undefined")
  assert({ actual, expected })
}

try {
  assertAndNormalizeDirectoryUrl("http://example.com")
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`directoryUrl must starts with file://, received http://example.com`)
  assert({ actual, expected })
}

{
  const actual = assertAndNormalizeDirectoryUrl("file:///directory")
  const expected = "file:///directory/"
  assert({ actual, expected })
}

{
  const actual = assertAndNormalizeDirectoryUrl("/directory")
  const expected = "file:///directory/"
  assert({ actual, expected })
}

{
  const actual = assertAndNormalizeDirectoryUrl(new URL("file:///directory"))
  const expected = "file:///directory/"
  assert({ actual, expected })
}
