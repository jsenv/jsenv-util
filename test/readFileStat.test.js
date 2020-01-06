import { assert } from "@jsenv/assert"
import { readFileSystemNodeStat } from "../index.js"

{
  const stats = await readFileSystemNodeStat(import.meta.url)
  const actual = stats.isFile()
  const expected = true
  assert({ actual, expected })
}
