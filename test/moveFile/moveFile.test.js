import { assert } from "@jsenv/assert"
import {
  cleanDirectory,
  resolveUrl,
  createDirectory,
  writeFile,
  moveFile,
  readFile,
  urlToFileSystemPath,
  removeFile,
  writeSymbolicLink,
  readSymbolicLink,
  fileExists,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const destinationDirectoryUrl = resolveUrl("otherdir/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("file.txt", destinationDirectoryUrl)
await cleanDirectory(tempDirectoryUrl)
await createDirectory(directoryUrl)
await createDirectory(destinationDirectoryUrl)

// source does not exists
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

// source is a directory
try {
  await moveFile(directoryUrl, destinationDirectoryUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `moveFile must be called on a file, found directory at ${urlToFileSystemPath(directoryUrl)}`,
  )
  assert({ actual, expected })
}

// source is a symbolic link
// ( I think the proper behaviour should be to move the symlinked file)
// only if we use moveSymbolicLink, then we would move the symlink instead
// same for every function working with files or directories
// they should not rely on lstat by on stat
// so that they ignore the symlink
// only function working with symlink would consider them
// all test must now have a source being a symlink
// that points either to a directory or a file or nothing (symlink broken)
// so ensure and document this behaviour
{
  await writeSymbolicLink(fileUrl, "./otherfile.js")
  await moveFile(fileUrl, fileDestinationUrl)
  const actual = {
    sourceFileExists: await fileExists(fileUrl),
    destinationFileContent: await readSymbolicLink(fileDestinationUrl),
  }
  const expected = {
    sourceFileExists: false,
    destinationFileContent: "./otherfile.js",
  }
  assert({ actual, expected })
  await removeFile(fileDestinationUrl)
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
