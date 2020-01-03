import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  resolveUrl,
  writeFileContent,
  directoryExists,
  fileExists,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.js", directoryUrl)
await writeFileContent(fileUrl, "coucou")
await cleanDirectory(directoryUrl)

{
  const actual = await directoryExists(directoryUrl)
  const expected = true
  assert({ actual, expected })
}

{
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}
