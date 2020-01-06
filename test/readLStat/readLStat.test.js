import { assert } from "@jsenv/assert"
import {
  writeDirectory,
  writeFile,
  resolveUrl,
  readFileSystemNodeStat,
  writePermissions,
  removeFileSystemNode,
  urlToFileSystemPath,
} from "../../index.js"
import { makeBusyFile } from "../testHelpers.js"

const tempDirectoryUrl = import.meta.resolve("./temp/")
const directoryUrl = resolveUrl("directory/", tempDirectoryUrl)
const fileUrl = resolveUrl("file.txt", tempDirectoryUrl)
await writeDirectory(tempDirectoryUrl)

// lstat on directory without permission
{
  await writeDirectory(directoryUrl)
  await writePermissions(directoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  const directoryStat = await readFileSystemNodeStat(directoryUrl)
  const actual = typeof directoryStat
  const expected = "object"
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
}

// lstat on file without permission
{
  await writeFile(fileUrl, "coucou")
  await writePermissions(fileUrl, {
    owner: { read: false, write: false, execute: false },
  })
  const fileStat = await readFileSystemNodeStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
  await removeFileSystemNode(fileUrl)
}

// lstat on busy file
await makeBusyFile(fileUrl, async () => {
  const fileStat = await readFileSystemNodeStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
})

// lstat on file inside a directory without the read permission (should result in EACCESS)
{
  const directoryFileUrl = resolveUrl("file.js", directoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(directoryFileUrl, "")
  await writePermissions(directoryUrl, {
    owner: { read: false, write: false, execute: false },
  })
  try {
    await readFileSystemNodeStat(directoryFileUrl)
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
    await removeFileSystemNode(directoryUrl, { removeContent: true })
  }
}

// lstat on normal directory
{
  await writeDirectory(directoryUrl)
  const directoryStat = await readFileSystemNodeStat(directoryUrl)
  const actual = typeof directoryStat
  const expected = "object"
  assert({ actual, expected })
  await removeFileSystemNode(directoryUrl)
}

// lstat on normal file
{
  await writeFile(fileUrl, "")
  const fileStat = await readFileSystemNodeStat(fileUrl)
  const actual = typeof fileStat
  const expected = "object"
  assert({ actual, expected })
  await removeFileSystemNode(fileUrl)
}

// lstat on nothing
try {
  await readFileSystemNodeStat(fileUrl)
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
  const actual = await readFileSystemNodeStat(fileUrl, { nullIfNotFound: true })
  const expected = null
  assert({ actual, expected })
}
