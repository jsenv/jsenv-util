import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  cleanDirectory,
  writeFile,
  copyFile,
  readFile,
  writePermissions,
  writeTimestamps,
  readPermissions,
  readTimestamps,
  urlToFileSystemPath,
  grantPermission,
  removeFile,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("./subdir/file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("./otherdir/file.txt", directoryUrl)
const permissions = {
  owner: { read: false, write: false, execute: false },
  group: { read: false, write: false, execute: false },
  others: { read: false, write: false, execute: false },
}
const atime = Date.now()
const mtime = Date.now()

await cleanDirectory(directoryUrl)

// source does not exists
try {
  await copyFile(fileUrl, fileDestinationUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `ENOENT: no such file or directory, copyfile '${urlToFileSystemPath(
      fileUrl,
    )}' -> '${urlToFileSystemPath(fileDestinationUrl)}'`,
  )
  expected.errno = -2
  expected.code = "ENOENT"
  expected.syscall = "copyfile"
  expected.path = urlToFileSystemPath(fileUrl)
  expected.dest = urlToFileSystemPath(fileDestinationUrl)
  assert({ actual, expected })
}

// copy without read/write permission
await writeFile(fileUrl, "Hello world")
await writePermissions(fileUrl, permissions)
await writeTimestamps(fileUrl, { atime, mtime })
await copyFile(fileUrl, fileDestinationUrl)
{
  const actual = await readPermissions(fileDestinationUrl)
  const expected = permissions
  assert({ actual, expected })
}
{
  const actual = await readTimestamps(fileDestinationUrl)
  const expected = {
    // reading atime mutates its value, so we cant assert something about it
    atime: actual.atime,
    mtime,
  }
  assert({ actual, expected })
}
{
  await grantPermission(fileDestinationUrl, { read: true })
  const actual = await readFile(fileDestinationUrl)
  const expected = "Hello world"
  assert({ actual, expected })
}

// destination is overwritten
await grantPermission(fileUrl, { read: true, write: true })
await writeFile(fileUrl, "foo")
await copyFile(fileUrl, fileDestinationUrl)
{
  const actual = await readFile(fileDestinationUrl)
  const expected = "foo"
  assert({ actual, expected })
}
