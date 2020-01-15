import { assert } from "@jsenv/assert"
import {
  ensureEmptyDirectory,
  removeFileSystemNode,
  resolveUrl,
  writeFile,
  registerFileLifecycle,
  writeFileSystemNodeModificationTime,
  moveFileSystemNode,
} from "../../index.js"
import { wait } from "../testHelpers.js"

const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)
await ensureEmptyDirectory(tempDirectoryUrl)

// added file exists
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {
      mutations.push({ type: "added" })
    },
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    removed: () => {
      mutations.push({ type: "removed" })
    },
    keepProcessAlive: false,
  })

  const actual = mutations
  const expected = []
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// added, file exstis and notifyExistent
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {
      mutations.push({ type: "added" })
    },
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    removed: () => {
      mutations.push({ type: "removed" })
    },
    keepProcessAlive: false,
    notifyExistent: true,
  })

  const actual = mutations
  const expected = [{ type: "added" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// added, removed, added
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {
      mutations.push({ type: "added" })
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
  const expected = [{ type: "added" }, { type: "added" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// added, updated, removed
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {
      mutations.push({ type: "added" })
    },
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    removed: () => {
      mutations.push({ type: "removed" })
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
  const expected = [{ type: "added" }, { type: "updated" }, { type: "removed" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// move
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const destinationUrl = resolveUrl("file-2", tempDirectoryUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {
      mutations.push({ type: "added" })
    },
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    removed: () => {
      mutations.push({ type: "removed" })
    },
    keepProcessAlive: false,
  })
  await writeFile(fileUrl)
  await wait(200)
  await moveFileSystemNode(fileUrl, destinationUrl)
  await wait(200)
  const actual = mutations
  const expected = [{ type: "added" }, { type: "removed" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// removed
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    removed: () => {
      mutations.push({ type: "removed" })
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
  const expected = [{ type: "removed" }, { type: "removed" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// updated lot
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  await writeFile(fileUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    removed: () => {
      mutations.push({ type: "removed" })
    },
    keepProcessAlive: false,
  })
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(300)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(300)
  await writeFileSystemNodeModificationTime(fileUrl, Date.now())
  await wait(300)

  const actual = mutations
  const expected = [{ type: "updated" }, { type: "updated" }, { type: "updated" }]
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}

// windows eperm
{
  const fileUrl = resolveUrl("file", tempDirectoryUrl)
  const mutations = []
  const unregister = registerFileLifecycle(fileUrl, {
    added: () => {},
    updated: (data) => {
      mutations.push({ type: "updated", ...data })
    },
    keepProcessAlive: false,
  })
  await removeFileSystemNode(tempDirectoryUrl)
  await wait(200)

  const actual = mutations
  const expected = []
  assert({ actual, expected })
  unregister()
  await ensureEmptyDirectory(tempDirectoryUrl)
}
