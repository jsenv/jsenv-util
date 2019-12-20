import { assert } from "@jsenv/assert"
import { urlHasScheme } from "../index.js"

{
  const actual = urlHasScheme("/directory/file.js")
  const expected = false
  assert({ actual, expected })
}

{
  const actual = urlHasScheme("file:///directory/file.js")
  const expected = true
  assert({ actual, expected })
}

{
  const actual = urlHasScheme("C:\\directory\\file.js")
  const expected = false
  assert({ actual, expected })
}

{
  const actual = urlHasScheme("file:///C:/directory/file.js")
  const expected = true
  assert({ actual, expected })
}

{
  const actual = urlHasScheme("http://example.com/file.js")
  const expected = true
  assert({ actual, expected })
}
