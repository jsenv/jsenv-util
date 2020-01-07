import { assert } from "@jsenv/assert"
import { cleanDirectory, writeFile, resolveUrl, readFile } from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

{
  const directoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const fileUrl = resolveUrl("file.txt", directoryUrl)
  await writeFile(fileUrl, "hello world")
  const actual = await readFile(fileUrl)
  const expected = "hello world"
  assert({ actual, expected })
  await cleanDirectory(tempDirectoryUrl)
}
