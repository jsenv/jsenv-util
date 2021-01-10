import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  writeFileSystemNodeModificationTime,
  readFileSystemNodeModificationTime,
  resolveUrl,
  writeFile,
} from "@jsenv/util"
import { toSecondsPrecision } from "@jsenv/util/test/testHelpers.js"

const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)
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
