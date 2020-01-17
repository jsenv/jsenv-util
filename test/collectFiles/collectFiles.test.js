import { assert } from "@jsenv/assert"
import { ensureEmptyDirectory, resolveUrl, collectFiles, writeFile } from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")

{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const eUrl = resolveUrl("a/aa/e.js", tempDirectoryUrl)
  const dUrl = resolveUrl("a/d.js", tempDirectoryUrl)
  const cUrl = resolveUrl("b/c.js", tempDirectoryUrl)
  const aUrl = resolveUrl("a.js", tempDirectoryUrl)
  const bUrl = resolveUrl("b.js", tempDirectoryUrl)
  const specifierMetaMap = {
    "./**/*.js": {
      source: true,
    },
  }
  await writeFile(eUrl)
  await writeFile(dUrl)
  await writeFile(cUrl)
  await writeFile(aUrl)
  await writeFile(bUrl)

  const matchingFileResultArray = await collectFiles({
    directoryUrl: tempDirectoryUrl,
    specifierMetaMap,
    predicate: ({ source }) => source,
  })
  const actual = matchingFileResultArray.map(({ relativeUrl }) => relativeUrl)
  const expected = ["a/aa/e.js", "a/d.js", "b/c.js", "a.js", "b.js"]
  assert({ actual, expected })
}
