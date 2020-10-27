import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  resolveUrl,
  writeFile,
  removeFileSystemNode,
  writeDirectory,
  registerDirectoryLifecycle,
  writeFileSystemNodeModificationTime,
} from "../../index.js"
import { wait } from "../testHelpers.js"

const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)
await ensureEmptyDirectory(tempDirectoryUrl)

// file added
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    added: (data) => {
      mutations.push({ name: "added", ...data })
    },
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    keepProcessAlive: false,
  })

  await writeFile(fileUrl)
  await wait(200)
  await removeFileSystemNode(fileUrl)
  await wait(200)
  await writeFile(fileUrl)
  await wait(200)
  const actual = mutations
  const expected = [
    { name: "added", relativeUrl: "file", type: "file" },
    { name: "added", relativeUrl: "file", type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// file added inside directory
{
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  const fileUrl = resolveUrl("dir/file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    added: (data) => {
      mutations.push({ name: "added", ...data })
    },
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    keepProcessAlive: false,
    recursive: true,
  })
  await writeDirectory(directoryUrl)
  await wait(200)
  await writeFile(fileUrl)
  await wait(200)

  const actual = mutations
  const expected = [
    { name: "added", relativeUrl: `dir`, type: "directory" },
    { name: "added", relativeUrl: `dir/file`, type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// add, update, remove file
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    added: (data) => {
      mutations.push({ name: "added", ...data })
    },
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    removed: (data) => {
      mutations.push({ name: "removed", ...data })
    },
    keepProcessAlive: false,
  })
  await writeFile(fileUrl)
  await wait(200)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(200)
  await removeFileSystemNode(fileUrl)
  await wait(200)

  const actual = mutations
  const expected = [
    { name: "added", relativeUrl: "file", type: "file" },
    { name: "updated", relativeUrl: "file", type: "file" },
    { name: "removed", relativeUrl: "file", type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// remove, add, remove a file
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  await writeFile(fileUrl)

  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    removed: (data) => {
      mutations.push({ name: "removed", ...data })
    },
    keepProcessAlive: false,
  })
  await removeFileSystemNode(fileUrl)
  await wait(200)
  await writeFile(fileUrl)
  await wait(200)
  await removeFileSystemNode(fileUrl)
  await wait(200)
  const actual = mutations
  const expected = [
    { name: "removed", relativeUrl: "file", type: "file" },
    { name: "removed", relativeUrl: "file", type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// remove inside directory
{
  const directoryUrl = resolveUrl("dir", tempDirectoryUrl)
  const fileUrl = resolveUrl("dir/file", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  await writeFile(fileUrl)
  const mutations = []

  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    removed: (data) => {
      mutations.push({ name: "removed", ...data })
    },
    keepProcessAlive: false,
    recursive: true,
  })
  await removeFileSystemNode(fileUrl)
  await removeFileSystemNode(directoryUrl)
  await wait(200)
  await writeDirectory(directoryUrl)
  await writeFile(fileUrl)
  await wait(200)
  await removeFileSystemNode(fileUrl)
  await removeFileSystemNode(directoryUrl)
  await wait(200)
  const actual = mutations
  const expected = [
    { name: "removed", relativeUrl: "dir/file", type: "file" },
    { name: "removed", relativeUrl: "dir", type: "directory" },
    { name: "removed", relativeUrl: "dir/file", type: "file" },
    { name: "removed", relativeUrl: "dir", type: "directory" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// update file
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  const mutations = []

  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    keepProcessAlive: false,
  })
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(200)
  // file removed and created in between
  await removeFileSystemNode(fileUrl)
  await wait(200)
  await writeFile(fileUrl)
  await wait(200)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now() + 1000)
  await wait(200)
  const actual = mutations
  const expected = [
    { name: "updated", relativeUrl: "file", type: "file" },
    { name: "updated", relativeUrl: "file", type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// update many
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  await wait(200)
  const mutations = []

  const unregister = registerDirectoryLifecycle(tempDirectoryUrl, {
    updated: (data) => {
      mutations.push({ name: "updated", ...data })
    },
    keepProcessAlive: false,
  })
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(200)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(200)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(200)
  const actual = mutations
  const expected = [
    { name: "updated", relativeUrl: "file", type: "file" },
    { name: "updated", relativeUrl: "file", type: "file" },
    { name: "updated", relativeUrl: "file", type: "file" },
  ]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}
