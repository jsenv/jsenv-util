import { assert } from "@jsenv/assert"
import { writeTimestamps, readTimestamps, resolveUrl } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.txt", directoryUrl)
const mtime = Date.now()
await writeTimestamps(fileUrl, { mtime })

{
  const actual = await readTimestamps(fileUrl)
  const expected = { atime: mtime, mtime }
  assert({ actual, expected })
}
