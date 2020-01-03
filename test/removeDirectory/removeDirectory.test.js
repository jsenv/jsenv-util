import { assert } from "@jsenv/assert"
import { fileExists, writeFile, removeDirectory, resolveUrl } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.js", directoryUrl)
await writeFile(fileUrl, "coucou")
await removeDirectory(directoryUrl)

const actual = await fileExists(directoryUrl)
const expected = false
assert({ actual, expected })
