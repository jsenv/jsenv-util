import { resolveUrl, readFile } from "@jsenv/util"

const directoryUrl = resolveUrl("./", import.meta.url)
console.log(directoryUrl)

const packageUrl = resolveUrl("package.json", directoryUrl)
const packageData = await readFile(packageUrl, { as: "json" })
console.log(JSON.stringify(packageData, null, "  "))
