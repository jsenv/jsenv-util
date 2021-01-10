import { assert } from "@jsenv/assert"
import { readFile, resolveUrl } from "@jsenv/util"

{
  const txtFileUrl = resolveUrl("./file.txt", import.meta.url)
  const actual = await readFile(txtFileUrl)
  const expected = "hello world"
  assert({ actual, expected })
}
