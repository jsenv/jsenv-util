import { assert } from "@jsenv/assert"
import { fileExists, writeFileContent, removeDirectory, resolveUrl } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.js", directoryUrl)
await writeFileContent(fileUrl, "coucou")
await removeDirectory(directoryUrl)

const actual = await fileExists(directoryUrl)
const expected = false
assert({ actual, expected })
