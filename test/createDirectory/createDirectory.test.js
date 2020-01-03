import { assert } from "@jsenv/assert"
import { createDirectory, removeDirectory, directoryExists } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
await removeDirectory(directoryUrl)
await createDirectory(directoryUrl)

{
  const actual = await directoryExists(directoryUrl)
  const expected = true
  assert({ actual, expected })
}

// ensure does not throw if already exists
await createDirectory(directoryUrl)
