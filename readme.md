> This repository is replaced by https://github.com/jsenv/filesystem

# util

Set of functions often needed when using Node.js.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-util.svg?logo=github&label=package)](https://github.com/jsenv/jsenv-util/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/util.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/util)
[![github ci](https://github.com/jsenv/jsenv-util/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-util/actions?workflow=ci)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-util/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-util)

# Table of contents

- [Presentation](#Presentation)
- [Example](#Example)
- [Installation](#Installation)
- [Terminology](#Terminology)
- [assertAndNormalizeDirectoryUrl](#assertAndNormalizeDirectoryUrl)
- [assertAndNormalizeFileUrl](#assertAndNormalizeFileUrl)
- [assertDirectoryPresence](#assertDirectoryPresence)
- [assertFilePresence](#assertFilePresence)
- [bufferToEtag](#bufferToEtag)
- [collectFiles](#collectFiles)
- [comparePathnames](#comparePathnames)
- [copyFileSystemNode](#copyFileSystemNode)
- [ensureEmptyDirectory](#ensureEmptyDirectory)
- [ensureParentDirectories](#ensureParentDirectories)
- [fileSystemPathToUrl](#fileSystemPathToUrl)
- [isFileSystemPath](#isFileSystemPath)
- [moveFileSystemNode](#moveFileSystemNode)
- [readDirectory](#readDirectory)
- [readFile](#readFile)
- [readFileSystemNodeModificationTime](#readFileSystemNodeModificationTime)
- [readFileSystemNodeStat](#readFileSystemNodeStat)
- [readSymbolicLink](#readSymbolicLink)
- [registerDirectoryLifecycle](#registerDirectoryLifecycle)
- [registerFileLifecycle](#registerFileLifecycle)
- [removeFileSystemNode](#removeFileSystemNode)
- [resolveUrl](#resolveUrl)
- [urlIsInsideOf](#urlIsInsideOf)
- [urlToBasename](#urlToBasename)
- [urlToExtension](#urlToExtension)
- [urlToFilename](#urlToFilename)
- [urlToFileSystemPath](#urlToFileSystemPath)
- [urlToOrigin](#urlToOrigin)
- [urlToParentUrl](#urlToParentUrl)
- [urlToPathname](#urlToPathname)
- [urlToRelativeUrl](#urlToRelativeUrl)
- [urlToRessource](#urlToRessource)
- [urlToScheme](#urlToScheme)
- [writeDirectory](#writeDirectory)
- [writeFile](#writeFile)
- [writeFileSystemNodeModificationTime](#writeFileSystemNodeModificationTime)
- [writeSymbolicLink](#writeSymbolicLink)
- [Advanced api](#Advanced-api)

# Presentation

This repository provides utils functions needed to work with files. It has no external dependency and two preferences:

<details>
  <summary>prefer url over filesystem path</summary>

An url is better than a filesystem path because it does not care about the underlying filesystem format.

- A file url: `file:///directory/file.js`
- A Windows file path: `C:\\directory\\file.js`
- A Linux file path: `/directory/file.js`

</details>

<details>
  <summary>prefer url string over url object</summary>

There is a deliberate preference for url string over url object in the documentation and codebase.

```js
const urlString = "file:///directory/file.js"
const urlObject = new URL("file:///directory/file.js")
```

A string is a simpler primitive than an url object and it becomes important while debugging.

<details>
  <summary>Screenshot of an url object while debugging</summary>

![screenshot of url object while debugging in vscode](./docs/debug-url-object.png)

</details>

<details>
  <summary>Screenshot of an url string while debugging</summary>

![screenshot of url string while debugging in vscode](./docs/debug-url-string.png)

</details>

</details>

This repository also provides some utils around urls not provided by Node.js. For instance it exports [urlToRelativeUrl](#urlToRelativeUrl) which can be seen as the equivalent of [path.relative](https://nodejs.org/dist/latest-v15.x/docs/api/path.html#path_path_relative_from_to) for urls.

Finally exported functions fully support url, even url string while native `fs` module does not.

<details>
  <summary>fs lack support for url string</summary>

`fs` module accepts url object since version 7.6 but not url string.

![screenshot of readFile documentation changelog](./docs/screenshot-node-doc-url.png)

Passing an url string to a function from `fs` will always throw [ENOENT](https://nodejs.org/api/errors.html#errors_common_system_errors) error.

```js
import { readFileSync } from "fs"

readFileSync(import.meta.url) // throw ENOENT
```

```js
const { readFileSync } = require("fs")

readFileSync(`file://${__filename}`) // throw ENOENT
```

> Node.js made this choice for performance reasons but it hurts my productivity.

</details>

# Example

The code below is a basic example reading package.json file as buffer.

```js
import { readFileSync } from "fs"
import { resolveUrl, urlToFileSystemPath } from "@jsenv/util"

const packageFileUrl = resolveUrl("package.json", import.meta.url)
const packageFilePath = urlToFileSystemPath(packageFileUrl)
const packageFileBuffer = readFileSync(packageFilePath)
```

With times more functions were added, all util are documented a bit further.

# Installation

```console
npm install @jsenv/util
```

# Terminology

This documentation and source code uses some wording explained in this part.

## Urls parts

You can refer to figure below to see how each part of an url is named.

<pre>
                                                           href
                   ┌────────────────────────────────────────┴──────────────────────────────────────────────┐
                origin                                                                                     │
      ┌────────────┴──────────────┐                                                                        │
      │                       authority                                                                    │
      │           ┌───────────────┴───────────────────────────┐                                            │
      │           │                                         host                                        ressource
      │           │                                ┌──────────┴────────────────┐             ┌──────────────┴────────┬────────┐
      │           │                             hostname                       │          pathname                   │        │
      │           │                 ┌──────────────┴────────────┐              │      ┌──────┴──────┐                │        │
  protocol     userinfo         subdomain                    domain            │      │          filename            │        │
   ┌─┴──┐     ┌───┴────┐            │                  ┌────────┴───────┐      │      │         ┌───┴─────┐          │        │
scheme  │username password lowerleveldomains secondleveldomain topleveldomain port dirname   basename extension   search     hash
┌──┴───┐│┌──┴───┐ ┌──┴───┐ ┌──┬─┬─┴─────┬───┐┌───────┴───────┐ ┌──────┴──────┐┌┴┐┌────┴─────┐ ┌──┴───┐ ┌───┴───┐ ┌────┴────┐ ┌┴┐
│      │││      │ │      │ │  │ │       │   ││               │ │             ││ ││          │ │      │ │       │ │         │ │ │
scheme://username:password@test.abcdedgh.www.secondleveldomain.topleveldomain:123/hello/world/basename.extension?name=ferret#hash
</pre>

## fileSystemNode

`fileSystemNode` word is used when a function does not assume what it is going to interact with: file, directory, or something else. For example [copyFileSystemNode(fromUrl, toUrl, options)](#copyFileSystemNode) will take whatever is at `fromUrl` and copy it at `toUrl`.

# assertAndNormalizeDirectoryUrl

`assertAndNormalizeDirectoryUrl` is a function ensuring the received value can be normalized to a directory url string. This function is great to make a function accept various values as directory url and normalize it to a standard directory url like `file:///directory/`.

<details>
  <summary>assertAndNormalizeDirectoryUrl code example</summary>

```js
import { assertAndNormalizeDirectoryUrl } from "@jsenv/util"

assertAndNormalizeDirectoryUrl("/directory") // file:///directory/
assertAndNormalizeDirectoryUrl("C:\\directory") // file://C:/directory/
```

[unit test](./test/assertAndNormalizeDirectoryUrl/assertAndNormalizeDirectoryUrl.test.js) &bullet; [implementation](./src/assertAndNormalizeDirectoryUrl.js)

</details>

# assertAndNormalizeFileUrl

`assertAndNormalizeFileUrl` is a function ensuring the received value can be normalized to a file url string. This function is great to make a function accept various values as file url and normalize it to a standard file url like `file:///directory/file.js`.

<details>
  <summary>assertAndNormalizeFileUrl code example</summary>

```js
import { assertAndNormalizeFileUrl } from "@jsenv/util"

assertAndNormalizeFileUrl("/directory/file.js") // file:///directory/file.js
assertAndNormalizeFileUrl("C:\\directory\\file.js") // file:///C:/directory/file.js
```

[unit test](./test/assertAndNormalizeFileUrl/assertAndNormalizeFileUrl.test.js) &bullet; [implementation](./src/assertAndNormalizeFileUrl.js)

</details>

# assertDirectoryPresence

`assertDirectoryPresence` is an async function throwing if directory does not exists on the filesystem. This function is great when code expects a directory to exist before going further.

<details>
  <summary>assertDirectoryPresence code example</summary>

```js
import { assertDirectoryPresence } from "@jsenv/util"

await assertDirectoryPresence("file:///Users/directory/")
```

[unit test](./test/assertDirectoryPresence/assertDirectoryPresence.test.js) &bullet; [implementation](./src/assertDirectoryPresence.js)

</details>

# assertFilePresence

`assertFilePresence` is an async function throwing if a file does not exists on the filesystem. This function is great to when code expects a file to exist before going further.

<details>
  <summary>assertFilePresence code example</summary>

```js
import { assertFilePresence } from "@jsenv/util"

await assertFilePresence("file:///Users/directory/file.js")
```

[unit test](./test/assertFilePresence/assertFilePresence.test.js) &bullet; [implementation](./src/assertFilePresence.js)

</details>

# bufferToEtag

`bufferToEtag` is a function receiving a buffer and converting it into an eTag. This function returns a hash (a small string) representing a file content. You can later check if the file content has changed by comparing a previously generated eTag with the current file content.

<details>
  <summary>bufferToEtag code example</summary>

```js
import { bufferToEtag } from "@jsenv/util"

const eTag = bufferToEtag(Buffer.from("Hello world"))
const otherEtag = bufferToEtag(Buffer.from("Hello world"))
eTag === otherEtag // true
```

[unit test](./test/bufferToEtag/bufferToEtag.test.js) &bullet; [implementation](./src/bufferToEtag.js) &bullet; [Buffer documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/buffer.html) &bullet; [eTag documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)

</details>

# collectFiles

`collectFiles` is an async function collectings a subset of files inside a directory.

<details>
  <summary>collectFiles code example</summary>

```js
import { collectFiles } from "@jsenv/util"

const files = await collectFiles({
  directoryUrl: "file:///Users/you/directory",
  structuredMetaMap: {
    whatever: {
      "./**/*.js": 42,
    },
  },
  predicate: (meta) => {
    return meta.whatever === 42
  },
})
```

[unit test](./test/collectFiles/collectFiles.test.js) &bullet; [implementation](./src/collectFiles.js)

</details>

# comparePathnames

`comparePathnames` is a function compare two pathnames and returning which pathnames comes first in a filesystem.

<details>
  <summary>comparePathnames code example</summary>

```js
import { comparePathnames } from "@jsenv/util"

const pathnames = ["a/b.js", "a.js"]
pathnames.sort(comparePathnames)
```

[implementation](./src/comparePathnames.js)

</details>

# copyFileSystemNode

`copyFileSystemNode` is an async function creating a copy of the filesystem node at a given destination

<details>
  <summary>copyFileSystemNode code example</summary>

```js
import { copyFileSystemNode } from "@jsenv/util"

await copyFileSystemNode(`file:///file.js`, "file:///destination/file.js")
await copyFileSystemNode(`file:///directory`, "file:///destination/directory")
```

[unit test](./test/copyFileSystemNode/copyFileSystemNode.test.js) &bullet; [implementation](./src/copyFileSystemNode.js)

</details>

# ensureEmptyDirectory

`ensureEmptyDirectory` is an async function ensuring a directory is empty. It removes a directory content when it exists or create an empty directory.
This function was written for testing. It is meant to clean up a directory in case a previous test execution let some files and you want to clean them before running your test.

<details>
  <summary>ensureEmptyDirectory code example</summary>

```js
import { ensureEmptyDirectory } from "@jsenv/util"

await ensureEmptyDirectory(`file:///directory`)
```

[unit test](./test/ensureEmptyDirectory/ensureEmptyDirectory.test.js) &bullet; [implementation](./src/ensureEmptyDirectory.js)

</details>

# ensureParentDirectories

`ensureParentDirectories` is an async function creating every directory leading to a file. This function is useful to ensure a given file directories exists before doing any operation on that file.

<details>
  <summary>ensureParentDirectories code example</summary>

```js
import { ensureParentDirectories } from "@jsenv/util"

await ensureParentDirectories(`file:///directory/subdirectory/file.js`)
```

[implementation](./src/ensureParentDirectories.js)

</details>

# writeDirectory

`writeDirectory` is an async function creating a directory on the filesystem. `writeDirectory` is equivalent to [fs.promises.mkdir](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_mkdir_path_options) but accepts url strings as directory path.

<details>
  <summary>writeDirectory code example</summary>

```js
import { writeDirectory } from "@jsenv/util"

await writeDirectory(`file:///directory`)
```

[unit test](./test/writeDirectory/writeDirectory.test.js) &bullet; [implementation](./src/writeDirectory.js)

</details>

# fileSystemPathToUrl

`fileSystemPathToUrl` is a function returning a filesystem path from an url string. `fileSystemPathToUrl` is equivalent to [pathToFileURL from Node.js](https://nodejs.org/docs/latest-v13.x/api/url.html#url_url_pathtofileurl_path) but returns string instead of url objects.

<details>
  <summary>fileSystemPathToUrl code example</summary>

```js
import { fileSystemPathToUrl } from "@jsenv/util"

fileSystemPathToUrl("/directory/file.js")
```

[unit test](./test/fileSystemPathToUrl/fileSystemPathToUrl.test.js) &bullet; [implementation](./src/fileSystemPathToUrl.js)

</details>

# isFileSystemPath

`isFileSystemPath` is a function receiving a string and returning a boolean indicating if this string is a filesystem path.

<details>
  <summary>isFileSystemPath code example</summary>

```js
import { isFileSystemPath } from "@jsenv/util"

isFileSystemPath("/directory/file.js") // true
isFileSystemPath("C:\\directory\\file.js") // true
isFileSystemPath("directory/file.js") // false
isFileSystemPath("file:///directory/file.js") // false
```

[unit test](./test/isFileSystemPath/isFileSystemPath.test.js) &bullet; [implementation](./src/isFileSystemPath.js)

</details>

# moveFileSystemNode

`moveFileSystemNode` is an async function moving a filesystem node to a destination.

<details>
  <summary>moveFileSystemNode code example</summary>

```js
import { moveFileSystemNode } from "@jsenv/util"

await moveFileSystemNode("file:///file.js", "file:///destination/file.js")
await moveFileSystemNode("file:///directory", "file:///destination/directory")
```

[unit test](./test/moveFileSystemNode/moveFileSystemNode.test.js) &bullet; [implementation](./src/moveFileSystemNode.js)

</details>

# readDirectory

`readDirectory` is an async function returning an array of string representing all filesystem nodes inside that directory.

<details>
  <summary>readDirectory code example</summary>

```js
import { readDirectory } from "@jsenv/util"

const content = await readDirectory("file:///directory")
```

[implementation](./src/readDirectory.js)

</details>

# readFileSystemNodeModificationTime

`readFileSystemNodeModificationTime` is an async function returning a number of milliseconds representing the date when the file was modified.

<details>
  <summary>readFileSystemNodeModificationTime code example</summary>

```js
import { readFileSystemNodeModificationTime } from "@jsenv/util"

const mtimeMs = await readFileSystemNodeModificationTime("file:///directory/file.js")
```

[implementation](./src/readFileSystemNodeModificationTime.js)

</details>

# readFile

`readFile` is an async function returning the content of a file as string, buffer, or json.

<details>
  <summary>readFile code example</summary>

```js
import { readFile } from "@jsenv/util"

const fileContentAsString = await readFile("file:///directory/file.json")
const fileContentAsBuffer = await readFile("file:///directory/file.json", { as: "buffer" })
const fileContentAsJSON = await readFile("file:///directory/file.json", { as: "json" })
```

[unit test](./test/readFile/readFile.test.js) &bullet; [implementation](./src/readFile.js)

</details>

# readFileSystemNodeStat

`readFileSystemNodeStat` is an async function returning a filesystem node stats object. `readFileSystemNodeStat` is equivalent to [fs.promises.stats from Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_stat_path_options) but accepts url strings as file path.

<details>
  <summary>readFileSystemNodeStat code example</summary>

```js
import { readFileSystemNodeStat } from "@jsenv/util"

const stats = await readFileSystemNodeStat("file:///directory/file.js")
```

[unit test](./test/readFileSystemNodeStat/readFileSystemNodeStat.test.js) &bullet; [implementation](./src/readFileSystemNodeStat.js) &bullet; [stats object documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_class_fs_stats)

</details>

# readSymbolicLink

`readSymbolicLink` is an async function returning a symbolic link target as url string.

<details>
  <summary>readFileSystemNodeStat code example</summary>

```js
import { readSymbolicLink } from "@jsenv/util"

const targetUrlOrRelativeUrl = await readSymbolicLink("file:///directory/link")
```

[implementation](./src/readSymbolicLink.js) &bullet; [symlink documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fs_symlink_target_path_type_callback)

</details>

# registerDirectoryLifecycle

`registerDirectoryLifecycle` is a function watching a directory at a given path and calling `added`, `updated`, `removed` according to what is happening inside that directory. Usually, filesystem takes less than 100ms to notify something has changed.

<details>
  <summary>registerDirectoryLifecycle code example</summary>

```js
import { registerDirectoryLifecycle } from "@jsenv/util"

const contentMap = {}
const unregister = registerDirectoryLifecycle("file:///directory", {
  added: ({ relativeUrl, type }) => {
    contentMap[relativeUrl] = type
  },
  removed: ({ relativeUrl }) => {
    delete contentMap[relativeUrl]
  },
})

// you can call unregister when you want to stop watching the directory
unregister()
```

[unit test](./test/registerDirectoryLifecycle/registerDirectoryLifecycle.test.js) &bullet; [implementation](./src/registerDirectoryLifecycle.js)

</details>

# registerFileLifecycle

`registerFileLifecycle` is a function watching a file and calling `added`, `updated`, `removed` according to what is happening to that file. Usually, filesystem takes less than 100ms to notify something has changed.

<details>
  <summary>registerFileLifecycle code example</summary>

```js
import { readFileSync } from "fs"
import { registerFileLifecycle } from "@jsenv/file-watcher"

const filePath = "/file.config.json"
let currentConfig = null
const unregister = registerFileLifecycle(filePath, {
  added: () => {
    currentConfig = JSON.parse(String(readFileSync(filePath)))
  },
  updated: () => {
    currentConfig = JSON.parse(String(readFileSync(filePath)))
  },
  removed: () => {
    currentConfig = null
  },
  notifyExistent: true,
})

// you can call unregister() when you want to stop watching the file
unregister()
```

[unit test](./test/registerFileLifecycle/registerFileLifecycle.test.js) &bullet; [implementation](./src/registerFileLifecycle.js)

</details>

# removeFileSystemNode

`removeFileSystemNode` is an async function removing a node (directory, file, symbolic link) from the filesystem.

<details>
  <summary>removeFileSystemNode code example</summary>

```js
import { removeFileSystemNode } from "@jsenv/util"

await removeFileSystemNode("file:///file.js")
await removeFileSystemNode("file:///directory")
```

[unit test](./test/removeFileSystemNode/removeFileSystemNode.test.js) &bullet; [implementation](./src/removeFileSystemNode.js)

</details>

# resolveUrl

`resolveUrl` is a function receiving two arguments called `specifier` and `baseUrl`. Both arguments are **required**. `resolveUrl` applies url resolution between `specifier` and `baseUrl` and returns the corresponding absolute url string.

<details>
  <summary>resolveUrl code example</summary>

```js
import { resolveUrl } from "@jsenv/util"

resolveUrl("file.js", "file:///directory/") // file:///directory/file.js
```

[unit test](./test/resolveUrl/resolveUrl.test.js) &bullet; [implementation](./src/resolveUrl.js)

</details>

<details>
  <summary>Note about url resolution and directory</summary>

When working with directory urls, it is important to have a trailing `/`.

```js
new URL("foo.js", "file:///dir").href // file:///foo.js
new URL("foo.js", `file:///dir/`).href // file:///dir/foo.js
```

For this reason, if you have a variable holding a directory url, be sure to put a trailing slash.

```js
import { resolveUrl } from "@jsenv/util"

const directoryUrl = resolveUrl("./dir/", "file:///")
```

</details>

<details>
  <summary>Difference between resolveUrl and URL</summary>

Using `resolveUrl` means code wants to perform url resolution between something that can be relative: `specifier`, and something absolute: `baseUrl`.

For this reason `resolveUrl` will throw if `baseUrl` is `undefined`. This is a major difference with `URL` constructor that would not throw in such case.

```js
import { resolveUrl } from "@jsenv/util"

new URL("http://example.com", undefined) // does not throw

resolveUrl("http://example.com", undefined) // throw "baseUrl is missing to resolve http://example.com"
```

Technically, `http://example.com` is already absolute and does not need a `baseUrl` to be resolved. But, receiving `undefined` when an absolute url was expected indicates there is something wrong in the code.

This is a feature that helps to catch bugs.

</details>

# urlIsInsideOf

`urlIsInsideOf` is a function returning a boolean indicating if an url is inside an other url.

<details>
  <summary>urlIsInsideOf code example</summary>

```js
import { urlIsInsideOf } from "@jsenv/util"

urlIsInsideOf("file:///directory/file.js", "file:///directory/") // true
urlIsInsideOf("file:///file.js", "file:///directory/") // false
```

[unit test](./test/urlIsInsideOf/urlIsInsideOf.test.js) &bullet; [implementation](./src/urlIsInsideOf.js)

</details>

# urlToBasename

`urlToBasename` is receiving an url and returning its basename.

<details>
  <summary>urlToBasename code example</summary>

```js
import { urlToBasename } from "@jsenv/util"

urlToBasename("file:///directory/file.js") // "file"
urlToBasename("file:///directory/") // "directory"
urlToBasename("http://example.com") // ""
```

[unit test](./test/urlToBasename/urlToBasename.test.js) &bullet; [implementation](./src/urlToBasename.js)

</details>

# urlToExtension

`urlToExtension` is receiving an url and returning its extension.

<details>
  <summary>urlToExtension code example</summary>

```js
import { urlToExtension } from "@jsenv/util"

urlToExtension("file:///directory/file.js") // ".js"
urlToExtension("file:///directory/file.") // "."
urlToExtension("http://example.com/file") // ""
```

[unit test](./test/urlToExtension/urlToExtension.test.js) &bullet; [implementation](./src/urlToExtension.js)

</details>

# urlToFilename

`urlToFilename` is receiving an url and returning its filename.

<details>
  <summary>urlToFilename code example</summary>

```js
import { urlToFilename } from "@jsenv/util"

urlToFilename("file:///directory/file.js") // "file.js"
urlToFilename("file:///directory/file.") // "file."
urlToFilename("http://example.com/file") // "file"
```

[unit test](./test/urlToFilename/urlToFilename.test.js) &bullet; [implementation](./src/urlToFilename.js)

</details>

# urlToFileSystemPath

`urlToFileSystemPath` is a function returning a filesystem path from an url. `urlToFileSystemPath` is equivalent to [pathToFileURL from Node.js](https://nodejs.org/docs/latest-v13.x/api/url.html#url_url_pathtofileurl_path) but returns string instead of url objects.

<details>
  <summary>urlToFileSystemPath code example</summary>

```js
import { urlToFileSystemPath } from "@jsenv/util"

// on mac or linux
urlToFileSystemPath("file:///directory/file.js") // /directory/file.js

// on windows
urlToFileSystemPath("file://C:/directory/file.js") // C:\\directory\\file.js
```

[unit test](./test/urlToFileSystemPath/urlToFileSystemPath.test.js) &bullet; [implementation](./src/urlToFileSystemPath.js)

</details>

# urlToOrigin

`urlToOrigin` is a function receiving an url and returning its origin.

<details>
  <summary>urlToOrigin code example</summary>

```js
import { urlToOrigin } from "@jsenv/util"

urlToOrigin("file:///directory/file.js") // "file://"
urlToOrigin("http://example.com/file.js") // "http://example.com"
```

[unit test](./test/urlToOrigin/urlToOrigin.test.js) &bullet; [implementation](./src/urlToOrigin.js)

</details>

# urlToParentUrl

`urlToParentUrl` is a function receiving an url and returning its parent url if any or the url itself.

<details>
  <summary>urlToParentUrl code example</summary>

```js
import { urlToParentUrl } from "@jsenv/util"

urlToParentUrl("http://example.com/dir/file.js") // "http://example.com/dir/"
urlToParentUrl("http://example.com/dir/") // "http://example.com/"
urlToParentUrl("http://example.com/") // "http://example.com/"
```

[unit test](./test/urlToParentUrl/urlToParentUrl.test.js) &bullet; [implementation](./src/urlToParentUrl.js)

</details>

# urlToPathname

`urlToPathname` is a function receiving an url and returning its pathname.

<details>
  <summary>urlToPathname code example</summary>

```js
import { urlToPathname } from "@jsenv/util"

urlToPathname("http://example.com/dir/file.js") // "/dir/file.js"
urlToPathname("http://example.com/dir/") // "/dir/"
urlToPathname("http://example.com/") // "/"
```

[unit test](./test/urlToPathname/urlToPathname.test.js) &bullet; [implementation](./src/urlToPathname.js)

</details>

# urlToRelativeUrl

`urlToRelativeUrl` is a function receiving two absolute urls and returning the first url relative to the second one. `urlToRelativeUrl` is the url equivalent to [path.relative from Node.js](https://nodejs.org/docs/latest-v13.x/api/path.html#path_path_relative_from_to).

<details>
  <summary>urlToRelativeUrl code example</summary>

```js
import { urlToRelativeUrl } from "@jsenv/util"

urlToRelativeUrl("file:///directory/file.js", "file:///directory/") // file.js
urlToRelativeUrl("file:///directory/index.js", "file:///directory/foo/file.js") // ../index.js
```

[unit test](./test/urlToRelativeUrl/urlToRelativeUrl.test.js) &bullet; [implementation](./src/urlToRelativeUrl.js)

</details>

# urlToRessource

`urlToRessource` is a function receiving an url and returning its ressource.

<details>
  <summary>urlToRessource code example</summary>

```js
import { urlToRessource } from "@jsenv/util"

urlToRessource("http://example.com/dir/file.js?foo=bar#10") // "/dir/file.js?foo=bar#10"
```

[unit test](./test/urlToRessource/urlToRessource.test.js) &bullet; [implementation](./src/urlToRessource.js)

</details>

# urlToScheme

`urlToScheme` is a function receiving an url and returning its scheme.

<details>
  <summary>urlToScheme code example</summary>

```js
import { urlToScheme } from "@jsenv/util"

urlToScheme("http://example.com") // "http"
urlToScheme("file:///dir/file.js") // "file"
urlToScheme("about:blank") // "about"
```

[unit test](./test/urlToScheme/urlToScheme.test.js) &bullet; [implementation](./src/urlToScheme.js)

</details>

# writeFile

`writeFile` is an async function writing file and its content on the filesystem. This function auto create file parent directories if they do not exists.

<details>
  <summary>writeFile code example</summary>

```js
import { writeFile } from "@jsenv/util"

await writeFile("file:///directory/file.txt", "Hello world")
```

[unit test](./test/writeFile/writeFile.test.js) &bullet; [implementation](./src/writeFile.js)

</details>

# writeFileSystemNodeModificationTime

`writeFileSystemNodeModificationTime` is an async function writing file and its content on the filesystem. `writeFileSystemNodeModificationTime` is like [fs.promises.utimes](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_utimes_path_atime_mtime) but accepts url strings as file path.

<details>
  <summary>writeFileSystemNodeModificationTime code example</summary>

```js
import { writeFileSystemNodeModificationTime } from "@jsenv/util"

await writeFileSystemNodeModificationTime("file:///directory/file.js", Date.now())
```

[unit test](./test/writeFileSystemNodeModificationTime/writeFileSystemNodeModificationTime.test.js) &bullet; [implementation](./src/writeFileSystemNodeModificationTime.js)

</details>

# writeSymbolicLink

`writeSymbolicLink` is an async function writing a symlink link to a file or directory on the filesystem.

<details>
  <summary>writeSymbolicLink code example</summary>

```js
import { writeSymbolicLink } from "@jsenv/util"

await writeSymbolicLink("file:///foo.js", "./bar.js")
```

[implementation](./src/writeFileSystemNodeModificationTime.js) &bullet; [symlink documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fs_symlink_target_path_type_callback)

</details>

# Advanced api

There is a few more functions but they are more specific, you probably don't need them: [Advanced api](./docs/internal-api.md)
