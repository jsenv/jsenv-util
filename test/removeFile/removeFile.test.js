import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  fileExists,
  writeFile,
  removeFile,
  resolveUrl,
  writePermissions,
  urlToFileSystemPath,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("file.txt", directoryUrl)
await cleanDirectory(directoryUrl)

// file already removed
await removeFile(fileUrl)

// remove a file in a directory without write permission
await writeFile(fileUrl, "coucou")
await writePermissions(directoryUrl, { owner: { read: true, write: false, execute: true } })
try {
  await removeFile(fileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(`EACCES: permission denied, unlink '${urlToFileSystemPath(fileUrl)}'`)
  expected.errno = -13
  expected.code = "EACCES"
  expected.syscall = "unlink"
  expected.path = urlToFileSystemPath(fileUrl)
  assert({ actual, expected })
}

// remove a file in a directory without write permission but auto granting permission
await removeFile(fileUrl, { autoGrantRequiredPermissions: true })
{
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}

// remove a normal file
await writeFile(fileUrl, "coucou")
await writePermissions(directoryUrl, {
  owner: { read: true, write: true },
  group: { read: true, write: true },
  others: { read: true, write: true },
})
await removeFile(fileUrl)
{
  const actual = await fileExists(fileUrl)
  const expected = false
  assert({ actual, expected })
}
