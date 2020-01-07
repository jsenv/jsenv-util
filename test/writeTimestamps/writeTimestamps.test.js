import { assert } from "@jsenv/assert"
import {
  writeFileSystemNodeModificationTime,
  readFileSystemNodeModificationTime,
  resolveUrl,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.txt", directoryUrl)
const mtime = Date.now()
await writeFileSystemNodeModificationTime(fileUrl, { mtime })

{
  const actual = await readFileSystemNodeModificationTime(fileUrl)
  const expected = mtime
  assert({ actual, expected })
}
