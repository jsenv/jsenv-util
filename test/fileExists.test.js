import { assert } from "@jsenv/assert"
import { fileExists } from "../index.js"

{
  const actual = await fileExists(import.meta.url)
  const expected = true
  assert({ actual, expected })
}

{
  const actual = await fileExists(import.meta.resolve("./whatever.js"))
  const expected = false
  assert({ actual, expected })
}
