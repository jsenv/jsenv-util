import { assert } from "@jsenv/assert"
import { fileExists, writeFileContent, removeFile } from "../../index.js"

const fileUrl = import.meta.resolve("./file.txt")
await writeFileContent(fileUrl, "coucou")
await removeFile(fileUrl)

const actual = await fileExists(fileUrl)
const expected = false
assert({ actual, expected })
