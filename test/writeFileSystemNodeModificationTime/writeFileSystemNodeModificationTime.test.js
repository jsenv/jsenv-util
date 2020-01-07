import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  writeFileSystemNodeModificationTime,
  readFileSystemNodeModificationTime,
  resolveUrl,
  writeFile,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

{
  const sourceUrl = resolveUrl("file.txt", tempDirectoryUrl)
  const mtime = Date.now()
  await writeFile(sourceUrl)
  await writeFileSystemNodeModificationTime(sourceUrl, mtime)

  const actual = await readFileSystemNodeModificationTime(sourceUrl)
  const expected = mtime
  assert({ actual, expected })
}
