import { assert } from "@jsenv/assert"
import { readFileStat } from "../index.js"

{
  const stats = await readFileStat(import.meta.url)
  const actual = stats.isFile()
  const expected = true
  assert({ actual, expected })
}
