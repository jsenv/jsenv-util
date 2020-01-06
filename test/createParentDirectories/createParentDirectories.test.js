import { assert } from "@jsenv/assert"
import { resolveUrl, cleanDirectory, writeParentDirectories, directoryExists } from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const subdirectoryUrl = resolveUrl("subdir/", directoryUrl)
const fileUrl = resolveUrl("file.js", subdirectoryUrl)
await cleanDirectory(directoryUrl)
await writeParentDirectories(fileUrl)

{
  const actual = await directoryExists(subdirectoryUrl)
  const expected = true
  assert({ actual, expected })
}

// ensure does not throw if already exists
await writeParentDirectories(fileUrl)
