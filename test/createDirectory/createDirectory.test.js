import { assert } from "@jsenv/assert"
import {
  resolveDirectoryUrl,
  createDirectory,
  cleanDirectory,
  directoryExists,
  writePermissions,
  urlToFileSystemPath,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const subdirUrl = resolveDirectoryUrl("subdir", directoryUrl)
await cleanDirectory(directoryUrl)
await writePermissions(directoryUrl, { owner: { read: true, write: false } })

try {
  await createDirectory(subdirUrl)
} catch (actual) {
  const expected = new Error(`EACCES: permission denied, mkdir '${urlToFileSystemPath(subdirUrl)}'`)
  expected.errno = -13
  expected.code = "EACCES"
  expected.syscall = "mkdir"
  expected.path = urlToFileSystemPath(subdirUrl)
  assert({ actual, expected })
}

await createDirectory(subdirUrl, { autoGrantRequiredPermissions: true })
{
  const actual = await directoryExists(subdirUrl)
  const expected = true
  assert({ actual, expected })
}

// ensure does not throw if already exists
await createDirectory(directoryUrl)
