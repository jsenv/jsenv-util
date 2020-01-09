import { assert } from "@jsenv/assert"
import { resolveUrl } from "../index.js"

{
  const actual = resolveUrl("./file.js", "file:///directory/")
  const expected = "file:///directory/file.js"
  assert({ actual, expected })
}

{
  const specifier = "./foo.js"

  try {
    resolveUrl(specifier)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new TypeError(`baseUrl missing to resolve ${specifier}`)
    assert({ actual, expected })
  }
}

if (process.platform === "win32") {
  // sepcifier starting with /
  {
    const actual = resolveUrl("/file.js", "file:///C:/directory/file.js")
    const expected = "file:///C:/file.js"
    assert({ actual, expected })
  }

  // absolute file specifier
  {
    const actual = resolveUrl("file:///file.js", "file:///d:/directory/file.js")
    const expected = "file:///d:/file.js"
    assert({ actual, expected })
  }

  // scheme relative specifier
  {
    const actual = resolveUrl("//dir/file.js", "file:///C:/directory/file.js")
    const expected = "file:///C:/dir/file.js"
    assert({ actual, expected })
  }

  // baseUrl is not a file (fallback to process.cwd drive letter)
  {
    const actual = resolveUrl("file:///file.js", "http://example.com")
    const expected = `file:///${process.cwd()[0]}:/file.js`
    assert({ actual, expected })
  }
}
