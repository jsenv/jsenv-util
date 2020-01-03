import { assert } from "@jsenv/assert"
import { resolveUrl, cleanDirectory, createFileDirectories, directoryExists } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const subdirectoryUrl = resolveUrl("subdir/", directoryUrl)
const fileUrl = resolveUrl("file.js", subdirectoryUrl)
await cleanDirectory(directoryUrl)
await createFileDirectories(fileUrl)

{
  const actual = await directoryExists(subdirectoryUrl)
  const expected = true
  assert({ actual, expected })
}

// ensure does not throw if already exists
await createFileDirectories(fileUrl)
