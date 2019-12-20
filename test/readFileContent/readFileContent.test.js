import { assert } from "@jsenv/assert"
import { readFileContent } from "../../index.js"

{
  const actual = await readFileContent(import.meta.resolve("./file.txt"))
  const expected = "hello world"
  assert({ actual, expected })
}
