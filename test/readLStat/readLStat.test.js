import { assert } from "@jsenv/assert"
import { createDirectory, writeFile, resolveUrl, readLStat, writePermissions } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.txt", directoryUrl)
// await cleanDirectory(directoryUrl)

await createDirectory(directoryUrl)
await writeFile(fileUrl, "coucou")
await writePermissions(directoryUrl, { owner: { read: false, write: true, execute: true } })
const fileStat = await readLStat(fileUrl)
debugger
