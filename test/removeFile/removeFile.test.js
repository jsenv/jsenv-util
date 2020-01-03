import { assert } from "@jsenv/assert"
import { fileExists, writeFile, removeFile } from "../../index.js"

const fileUrl = import.meta.resolve("./file.txt")
await writeFile(fileUrl, "coucou")
await removeFile(fileUrl)

const actual = await fileExists(fileUrl)
const expected = false
assert({ actual, expected })
