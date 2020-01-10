import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  writeFileSystemNodeModificationTime,
  readFileSystemNodeModificationTime,
  resolveUrl,
  writeFile,
} from "../../index.js"
import { toSecondsPrecision } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

{
  const sourceUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const mtime = toSecondsPrecision(Date.now())
  await writeFile(sourceUrl)
  await writeFileSystemNodeModificationTime(sourceUrl, mtime)

  const actual = toSecondsPrecision(await readFileSystemNodeModificationTime(sourceUrl))
  const expected = mtime
  assert({ actual, expected })
}
