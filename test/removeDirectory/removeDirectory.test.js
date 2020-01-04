import { assert } from "@jsenv/assert"
import {
  createDirectory,
  cleanDirectory,
  directoryExists,
  removeDirectory,
  resolveUrl,
  writeFile,
  writePermissions,
} from "../../index.js"

const directoryUrl = import.meta.resolve("./directory/")

// await cleanDirectory(directoryUrl)

// removing empty directory without write permission
// await writePermissions(directoryUrl, { write: false })
// await removeDirectory(directoryUrl)
// {
//   const actual = await directoryExists(directoryUrl)
//   const expected = false
//   assert({ actual, expected })
// }

// // remove empty directory without any permission
// await createDirectory(directoryUrl)
// await writePermissions(directoryUrl, {
//   owner: { read: false, write: false, execute: false },
// })
// await removeDirectory(directoryUrl)
// {
//   const actual = await directoryExists(directoryUrl)
//   const expected = false
//   assert({ actual, expected })
// }

// remove unreadable not empty directory
// await createDirectory(directoryUrl)
// await writeFile(fileUrl, "coucou")
// await writePermissions(directoryUrl, {
//   owner: { read: false },
// })
// await removeDirectory(directoryUrl, { removeContent: true, autoGrantRequiredPermissions: true })
// {
//   const actual = await directoryExists(directoryUrl)
//   const expected = false
//   assert({ actual, expected })
// }

// try with a nested dir
const subdirUrl = resolveUrl("subdir/", directoryUrl)
const fileUrl = resolveUrl("file.js", directoryUrl)
await createDirectory(directoryUrl)
await createDirectory(subdirUrl)
await writeFile(fileUrl, "coucou")
await writePermissions(directoryUrl, {
  owner: { read: false },
})
await writePermissions(subdirUrl, {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: true, execute: true },
  others: { read: true, write: true, execute: true },
})
await removeDirectory(directoryUrl, { removeContent: true, autoGrantRequiredPermissions: true })
{
  const actual = await directoryExists(directoryUrl)
  const expected = false
  assert({ actual, expected })
}

// await writeFile(fileUrl, "coucou")
// await writePermissions(directoryUrl, {
//   owner: { read: false },
// })
// await removeDirectory(directoryUrl, { removeContent: true, autoGrantRequiredPermissions: true })
// {
//   const actual = await directoryExists(directoryUrl)
//   const expected = false
//   assert({ actual, expected })
// }
