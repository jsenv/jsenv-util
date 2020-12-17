const { assertAndNormalizeDirectoryUrl, resolveUrl, readFile } = require("@jsenv/util")

const directoryUrl = assertAndNormalizeDirectoryUrl(__dirname)
console.log(directoryUrl)

const start = async () => {
  const packageUrl = resolveUrl("package.json", directoryUrl)
  const packageData = await readFile(packageUrl, { as: "json" })
  console.log(JSON.stringify(packageData, null, "  "))
}
start()
