import { assert } from "@jsenv/assert"
import {
  resolveUrl,
  cleanDirectory,
  writeFileContent,
  moveFile,
  readFileContent,
  urlToFileSystemPath,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")
const fileUrl = resolveUrl("./subdir/file.txt", directoryUrl)
const fileDestinationUrl = resolveUrl("./otherdir/file.txt", directoryUrl)

await cleanDirectory(directoryUrl)
await writeFileContent(fileUrl, "Hello world")
await moveFile(fileUrl, fileDestinationUrl)

{
  const actual = await readFileContent(fileDestinationUrl)
  const expected = "Hello world"
  assert({ actual, expected })
}

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

// destination is overwritten
await writeFileContent(fileUrl, "foo")
await moveFile(fileUrl, fileDestinationUrl)
{
  const actual = await readFileContent(fileDestinationUrl)
  const expected = "foo"
  assert({ actual, expected })
}
