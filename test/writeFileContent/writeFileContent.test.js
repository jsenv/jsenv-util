import { assert } from "@jsenv/assert"
import { writeFileContent, resolveUrl, readFileContent, removeDirectory } from "../../index.js"

{
  const directoryUrl = import.meta.resolve("./directory/")
  const fileUrl = resolveUrl("file.txt", directoryUrl)
  await writeFileContent(fileUrl, "hello world")
  const actual = await readFileContent(fileUrl)
  const expected = "hello world"
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
}
