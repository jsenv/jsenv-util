import { assert } from "@jsenv/assert"
import { resolveUrlPreservingWindowsDriveLetter } from "../index.js"

if (process.platform === "win32") {
  // specifier absolute http
  {
    const actual = resolveUrlPreservingWindowsDriveLetter(
      "http://example.com/file.js",
      "file:///C:/directory/file.js",
    )
    const expected = "http://example.com/file.js"
    assert({ actual, expected })
  }

  // specifier starting with /
  {
    const actual = resolveUrlPreservingWindowsDriveLetter(
      "/file.js",
      "file:///C:/directory/file.js",
    )
    const expected = "file:///C:/file.js"
    assert({ actual, expected })
  }

  // specifier absolute file
  {
    const actual = resolveUrlPreservingWindowsDriveLetter(
      "file:///file.js",
      "file:///d:/directory/file.js",
    )
    const expected = "file:///d:/file.js"
    assert({ actual, expected })
  }

  // specifier scheme relative
  {
    const actual = resolveUrlPreservingWindowsDriveLetter(
      "///dir/file.js",
      "file:///C:/directory/file.js",
    )
    const expected = "file:///C:/dir/file.js"
    assert({ actual, expected })
  }

  // importer http
  {
    const actual = resolveUrlPreservingWindowsDriveLetter("file:///file.js", "http://example.com")
    const expected = `file:///${process.cwd()[0]}:/file.js`
    assert({ actual, expected })
  }

  // importer has no drive letter
  try {
    resolveUrlPreservingWindowsDriveLetter("file:///file.js", "file:///dir")
  } catch (actual) {
    const expected = new Error(
      `cannot properly resolve file:///file.js because baseUrl (file:///dir) has no drive letter`,
    )
    assert({ actual, expected })
  }

  // importer undefined
  try {
    resolveUrlPreservingWindowsDriveLetter("./file.js")
  } catch (actual) {
    const expected = new Error(`baseUrl missing to resolve ./file.js`)
    assert({ actual, expected })
  }
} else {
  try {
    resolveUrlPreservingWindowsDriveLetter()
  } catch (actual) {
    const expected = new Error(`resolveUrlPreservingWindowsDriveLetter should be called on windows`)
    assert({ actual, expected })
  }
}
