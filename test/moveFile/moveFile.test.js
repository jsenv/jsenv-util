import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  createDirectory,
  writeFile,
  moveFile,
  readFile,
  urlToFileSystemPath,
  removeFile,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const destinationDirectoryUrl = resolveUrl("otherdir/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("file.txt", destinationDirectoryUrl)
await createDirectory(tempDirectoryUrl)
await createDirectory(directoryUrl)
await createDirectory(destinationDirectoryUrl)

// file does not exists
try {
  await moveFile(fileUrl, fileDestinationUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `ENOENT: no such file or directory, rename '${urlToFileSystemPath(
      fileUrl,
    )}' -> '${urlToFileSystemPath(fileDestinationUrl)}'`,
  )
  expected.errno = -2
  expected.code = "ENOENT"
  expected.syscall = "rename"
  expected.path = urlToFileSystemPath(fileUrl)
  expected.dest = urlToFileSystemPath(fileDestinationUrl)
  assert({ actual, expected })
}

// on a directory
try {
  await moveFile(directoryUrl, destinationDirectoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `moveFile must be called on a file, found directory at ${urlToFileSystemPath(directoryUrl)}`,
  )
  assert({ actual, expected })
}

// destination does not exists
{
  await writeFile(fileUrl, "Hello world")
  await moveFile(fileUrl, fileDestinationUrl)
  const actual = await readFile(fileDestinationUrl)
  const expected = "Hello world"
  assert({ actual, expected })
  await removeFile(fileDestinationUrl)
}

// destination exists
{
  await writeFile(fileUrl, "foo")
  await writeFile(fileDestinationUrl, "Hello world")
  await moveFile(fileUrl, fileDestinationUrl)
  const actual = await readFile(fileDestinationUrl)
  const expected = "foo"
  assert({ actual, expected })
  await removeFile(fileDestinationUrl)
}

// destination is an empty directory
await writeFile(fileUrl, "foo")
try {
  await moveFile(fileUrl, destinationDirectoryUrl)
} catch (actual) {
  const expected = new Error(
    `EISDIR: illegal operation on a directory, rename '${urlToFileSystemPath(
      fileUrl,
    )}' -> '${urlToFileSystemPath(destinationDirectoryUrl)}'`,
  )
  expected.errno = -21
  expected.code = "EISDIR"
  expected.syscall = "rename"
  expected.path = urlToFileSystemPath(fileUrl)
  expected.dest = urlToFileSystemPath(destinationDirectoryUrl)
  assert({ actual, expected })
  await removeFile(fileUrl, "foo")
}
