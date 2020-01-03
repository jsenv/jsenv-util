import { assert } from "@jsenv/assert"
import { writeFileModificationTime, readFileModificationTime, resolveUrl } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.txt", directoryUrl)
const time = Date.now()
await writeFileModificationTime(fileUrl, time)

{
  const actual = await readFileModificationTime(fileUrl)
  const expected = time
  assert({ actual, expected })
}
