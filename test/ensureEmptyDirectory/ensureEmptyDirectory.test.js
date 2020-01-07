import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  resolveUrl,
  writeFile,
  testFileSystemNodePresence,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await ensureEmptyDirectory(tempDirectoryUrl)

{
  const sourceUrl = resolveUrl("source", tempDirectoryUrl)
  const fileUrl = resolveUrl("source/file", tempDirectoryUrl)
  await writeFile(fileUrl, "coucou")

  await ensureEmptyDirectory(sourceUrl)
  const actual = {
    directoryPresence: await testFileSystemNodePresence(sourceUrl),
    filePresence: await testFileSystemNodePresence(fileUrl),
  }
  const expected = {
    directoryPresence: true,
    filePresence: false,
  }
  assert({ actual, expected })
  await ensureEmptyDirectory(tempDirectoryUrl)
}
