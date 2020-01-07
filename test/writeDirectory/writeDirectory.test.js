import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  cleanDirectory,
  writeFileSystemNodePermissions,
  urlToFileSystemPath,
  writeFile,
  writeSymbolicLink,
  resolveUrl,
} from "../../index.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
await cleanDirectory(tempDirectoryUrl)

// destination inside parent directory without write permission
{
  const parentDirectoryUrl = resolveUrl("dir/", tempDirectoryUrl)
  const destinationUrl = resolveUrl("dest", parentDirectoryUrl)
  await writeDirectory(parentDirectoryUrl)
  await writeFileSystemNodePermissions(parentDirectoryUrl, {
    owner: { read: true, write: false },
  })

  try {
    await writeDirectory(destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `EACCES: permission denied, lstat '${urlToFileSystemPath(destinationUrl)}'`,
    )
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "lstat"
    expected.path = urlToFileSystemPath(destinationUrl)
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a directory
{
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  await writeDirectory(destinationUrl)

  try {
    await writeDirectory(destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(`directory already exists at ${urlToFileSystemPath(destinationUrl)}`)
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a file
{
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeFile(destinationUrl)
  const directoryUrl = resolveUrl("dest/", tempDirectoryUrl)

  try {
    await writeDirectory(destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot write directory at ${urlToFileSystemPath(directoryUrl)} because there is a file`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a link to nothing
{
  const destinationUrl = resolveUrl("dest", tempDirectoryUrl)
  await writeSymbolicLink(destinationUrl, "./whatever")
  const directoryUrl = resolveUrl("dest/", tempDirectoryUrl)

  try {
    await writeDirectory(destinationUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `cannot write directory at ${urlToFileSystemPath(
        directoryUrl,
      )} because there is a symbolic-link`,
    )
    assert({ actual, expected })
    await cleanDirectory(tempDirectoryUrl)
  }
}

// destination is a directory and allowUseless is true
{
  const destinationUrl = resolveUrl("dest/", tempDirectoryUrl)
  await writeDirectory(destinationUrl)

  const actual = await writeDirectory(destinationUrl, { allowUseless: true })
  const expected = undefined
  assert({ actual, expected })
}
