import { assert } from "@jsenv/assert"
import {
  createDirectory,
  writeFile,
  resolveUrl,
  readLStat,
  writePermissions,
  removeDirectory,
  removeFile,
  urlToFileSystemPath,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
await createDirectory(tempDirectoryUrl)

// lstat on directory without permission
{
  await createDirectory(directoryUrl)
  await writePermissions(directoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  const directoryStat = await readLStat(directoryUrl)
  const actual = typeof directoryStat
  const expected = "object"
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
}

// lstat on file without permission
{
  await writeFile(fileUrl, "coucou")
  await writePermissions(fileUrl, {
    owner: { read: false, write: false, execute: false },
  })
  const fileStat = await readLStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
  await removeFile(fileUrl)
}

// lstat on busy file
await makeBusyFile(fileUrl, async () => {
  const fileStat = await readLStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
})

// lstat on file inside a directory without the read permission (should result in EACCESS)
{
  const directoryFileUrl = resolveUrl("file.js", directoryUrl)
  await createDirectory(directoryUrl)
  await writeFile(directoryFileUrl, "")
  await writePermissions(directoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  try {
    await readLStat(directoryFileUrl)
    throw new Error("should throw")
  } catch (actual) {
    const expected = new Error(
      `EACCES: permission denied, lstat '${urlToFileSystemPath(directoryFileUrl)}'`,
    )
    expected.errno = -13
    expected.code = "EACCES"
    expected.syscall = "lstat"
    expected.path = urlToFileSystemPath(directoryFileUrl)
    assert({ actual, expected })

    await writePermissions(directoryUrl, {
      owner: { read: true, execute: true },
    })
    await removeDirectory(directoryUrl, { removeContent: true })
  }
}

// lstat on normal directory
{
  await createDirectory(directoryUrl)
  const directoryStat = await readLStat(directoryUrl)
  const actual = typeof directoryStat
  const expected = "object"
  assert({ actual, expected })
  await removeDirectory(directoryUrl)
}

// lstat on normal file
{
  await writeFile(fileUrl, "")
  const fileStat = await readLStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
  await removeFile(fileUrl)
}

// lstat on nothing
try {
  await readLStat(fileUrl)
  throw new Error("should throw")
} catch (actual) {
  const expected = new Error(
    `ENOENT: no such file or directory, lstat '${urlToFileSystemPath(fileUrl)}'`,
  )
  expected.errno = -2
  expected.code = "ENOENT"
  expected.syscall = "lstat"
  expected.path = urlToFileSystemPath(fileUrl)
  assert({ actual, expected })
}

// lstat on nothing with nullIfNotFound
{
  const actual = await readLStat(fileUrl, { nullIfNotFound: true })
  const expected = null
  assert({ actual, expected })
}
