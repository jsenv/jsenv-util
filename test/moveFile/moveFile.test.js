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

// destination is a file
await writeFile(fileUrl, "foo")
await writeFile(fileDestinationUrl, "Hello world")
try {
  await moveFile(fileUrl, fileDestinationUrl)
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(fileUrl)} at ${urlToFileSystemPath(
      fileDestinationUrl,
    )} because destination file exists and overwrite option is disabled`,
  )
  assert({ actual, expected })
  await removeFile(fileDestinationUrl)
}

// destination is a file and overwrite: true
{
  await writeFile(fileUrl, "foo")
  await writeFile(fileDestinationUrl, "Hello world")
  await moveFile(fileUrl, fileDestinationUrl, { overwrite: true })
  const actual = await readFile(fileDestinationUrl)
  const expected = "foo"
  assert({ actual, expected })
  await removeFile(fileDestinationUrl)
}

// destination is a directory
await writeFile(fileUrl, "foo")
try {
  await moveFile(fileUrl, destinationDirectoryUrl, { overwrite: true })
} catch (actual) {
  const expected = new Error(
    `cannot move ${urlToFileSystemPath(fileUrl)} at ${urlToFileSystemPath(
      destinationDirectoryUrl,
    )} because destination is a directory`,
  )
  assert({ actual, expected })
  await removeFile(fileUrl, "foo")
}
