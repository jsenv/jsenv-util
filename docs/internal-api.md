An hidden documentation for exported function that are for advanced use case.

# Table of contents

- [grantPermissionsOnFileSystemNode](#grantPermissionsOnFileSystemNode)
- [readFileSystemNodePermissions](#readFileSystemNodePermissions)
- [testFileSystemNodePermissions](#testFileSystemNodePermissions)
- [writeFileSystemNodePermissions](#writeFileSystemNodePermissions)

# File permissions and Windows

File permissions, read/write/execute, is a concept from Linux also available on MacOS. For this reason you cannot use the following functions on Windows:

- [grantPermissionsOnFileSystemNode](#grantPermissionsOnFileSystemNode)
- [readFileSystemNodePermissions](#readFileSystemNodePermissions)
- [testFileSystemNodePermissions](#testFileSystemNodePermissions)
- [writeFileSystemNodePermissions](#writeFileSystemNodePermissions)

This limitation is inherited from Node.js. The following paragraph is quoted from Node.js documentation

> Caveats: on Windows only the write permission can be changed, and the distinction among the permissions of group, owner or others is not implemented.

In other words it's unusable on Windows. In the end working with file permission is not common, you certainly don't need them.

— See [File modes documentation on Node.js](https://nodejs.org/dist/latest-v15.x/docs/api/fs.html#fs_fs_chmodsync_path_mode)<br />

# grantPermissionsOnFileSystemNode

`grantPermissionsOnFileSystemNode` is an async function granting permission on a given file system node. It returns an async function restoring the previous permissions.

> Do not use on Windows because of [file permissions caveat](#file-permissions-and-windows)

```js
import { grantPermissionsOnFileSystemNode } from "@jsenv/util"

const restorePermissions = await grantPermissionsOnFileSystemNode("file:///file.js", {
  execute: true,
})
await restorePermissions()
```

— source code at [src/grantPermissionsOnFileSystemNode.js](../src/grantPermissionsOnFileSystemNode.js).

# readFileSystemNodePermissions

`readFileSystemNodePermissions` is an async function returning an object representing the permissions of a given filesystem node.

> Do not use on Windows because of [file permissions caveat](#file-permissions-and-windows)

```js
import { readFileSystemNodePermissions } from "@jsenv/util"

const permissions = await readFileSystemNodePermissions("file:///directory/file.js")
```

— see also [file modes documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_file_modes)<br />
— source code at [src/readFileSystemNodePermissions.js](../src/readFileSystemNodePermissions.js).

# testFileSystemNodePermissions

`testFileSystemNodePermissions` is an async function returning a boolean indicating if current user has read/write/execute permission on the filesystem node.

> Do not use on Windows because of [file permissions caveat](#file-permissions-and-windows)

```js
import { testFileSystemNodePermissions } from "@jsenv/util"

const allowed = await testFileSystemNodePermissions("file:///file.js", { execute: true })
```

— source code at [src/testFileSystemNodePermissions.js](../src/testFileSystemNodePermissions.js).

# writeFileSystemNodePermissions

`writeFileSystemNodePermissions` is an async function setting the permissions of a filesystem node.

> Do not use on Windows because of [file permissions caveat](#file-permissions-and-windows)

```js
import { writeFileSystemNodePermissions } from "@jsenv/util"

await writeFileSystemNodePermissions("file:///directory/file.js", {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: true, execute: false },
  others: { read: true, write: false, execute: false },
})
```

— see also [file modes documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_file_modes)<br />
— source code at [src/writeFileSystemNodePermissions.js](../src/writeFileSystemNodePermissions.js).
