import { assert } from "@jsenv/assert"
import { writeFile, resolveUrl, readFile, removeFileSystemNode } from "../../index.js"

{
  const directoryUrl = import.meta.resolve("./directory/")
  const fileUrl = resolveUrl("file.txt", directoryUrl)
  await writeFile(fileUrl, "hello world")
  const actual = await readFile(fileUrl)
  const expected = "hello world"
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
}
