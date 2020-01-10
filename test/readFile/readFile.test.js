import { assert } from "@jsenv/assert"
import { readFile } from "../../index.js"

{
  const actual = await readFile(import.meta.resolve("./file.txt"))
  const expected = "hello world"
  assert({ actual, expected })
}
