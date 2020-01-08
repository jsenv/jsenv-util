import { assert } from "@jsenv/assert"
import { ensureEmptyDirectory, resolveUrl, writeFile } from "../../index.js"
import { testDirectoryPresence, testFilePresence } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeFile(fileUrl, "coucou")

  await ensureEmptyDirectory(sourceUrl)
  const actual = {
    directoryPresence: await testDirectoryPresence(sourceUrl),
    filePresence: await testFilePresence(fileUrl),
  }
  const expected = {
    directoryPresence: true,
    filePresence: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
