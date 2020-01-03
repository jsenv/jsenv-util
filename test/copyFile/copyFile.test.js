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
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("./subdir/file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("./otherdir/file.txt", directoryUrl)
const chmod = 33261 // corresponds to 0o755
const atime = Date.now()
const mtime = Date.now()

await cleanDirectory(directoryUrl)
await writeFile(fileUrl, "Hello world")
await writePermissions(fileUrl, chmod)
await writeTimestamps(fileUrl, { atime, mtime })
await copyFile(fileUrl, fileDestinationUrl)

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
  const actual = await readPermissions(fileDestinationUrl)
  const expected = 33261
  assert({ actual, expected })
}
{
  const actual = await readFile(fileDestinationUrl)
  const expected = "Hello world"
  assert({ actual, expected })
}

// source does not exists
try {
  await copyFile(fileUrl, fileDestinationUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `EACCES: permission denied, copyfile '${urlToFileSystemPath(
      fileUrl,
    )}' -> '${urlToFileSystemPath(fileDestinationUrl)}'`,
  )
  expected.errno = -13
  expected.code = "EACCES"
  expected.syscall = "copyfile"
  expected.path = urlToFileSystemPath(fileUrl)
  expected.dest = urlToFileSystemPath(fileDestinationUrl)
  assert({ actual, expected })
}

// destination is overwritten
await writeFile(fileUrl, "foo")
await copyFile(fileUrl, fileDestinationUrl)
{
  const actual = await readFile(fileDestinationUrl)
  const expected = "foo"
  assert({ actual, expected })
}
