# util

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-util.svg?logo=github&label=package)](https://github.com/jsenv/jsenv-util/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/util.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/util)
[![github ci](https://github.com/jsenv/jsenv-util/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-util/actions?workflow=ci)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-util/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-util)

Set of functions often needed when using Node.js.

# Table of contents

- [Presentation](#Presentation)
- [Why prefer url string?](#Why-prefer-url-string)
- [Why prefer url over filesystem path?](#Why-prefer-url-over-filesystem-path)
- [API](#API)
  - [assertAndNormalizeDirectoryUrl](#assertAndNormalizeDirectoryUrl)
  - [assertAndNormalizeFileUrl](#assertAndNormalizeFileUrl)
  - [assertDirectoryExists](#assertDirectoryExists)
  - [assertFileExists](#assertFileExists)
  - [bufferToEtag](#bufferToEtag)
  - [cleanDirectory](#cleanDirectory)
  - [createDirectory](#createDirectory)
  - [createFileDirectories](#createFileDirectories)
  - [fileExists](#fileExists)
  - [fileSystemPathToUrl](#fileSystemPathToUrl)
  - [isFileSystemPath](#isFileSystemPath)
  - [moveFile](#moveFile)
  - [readFileModificationTime](#readFileModificationTime)
  - [readFileContent](#readFileContent)
  - [readFileStat](#readFileStat)
  - [removeDirectory](#removeDirectory)
  - [removeFile](#removeFile)
  - [resolveDirectoryUrl](#resolveDirectoryUrl)
  - [resolveUrl](#resolveUrl)
  - [urlToFileSystemPath](#urlToFileSystemPath)
  - [urlToRelativeUrl](#urlToRelativeUrl)
  - [writeFileContent](#writeFileContent)
  - [writeFileModificationTime](#writeFileModificationTime)
- [Installation](#Installation)

## Presentation

Many jsenv packages needs the same helper functions. This package exports and document them.

This repository exists mostly to work with files relative to a directory with an approach that works on windows and linux filesystems as shown in the code example below.

```js
import { readFileSync } from "fs"
import { resolveUrl, urlToFileSystemPath, assertAndNormalizeDirectoryUrl } from "@jsenv/util"

const directoryUrl = assertAndNormalizeDirectoryUrl(__dirname)
const packageFileUrl = resolveUrl("package.json", directoryUrl)
const packageFilePath = urlToFileSystemPath(packageFileUrl)
const packageFileBuffer = readFileSync(packageFilePath)
```

With times more functions were added, all util are documented in the [API](#API) part.

## Why prefer url string ?

```js
const urlString = "file:///directory/file.js"
const urlObject = new URL("file:///directory/file.js")
```

In this package functions working with urls prefer to receive url string or return url string and not url object.

This is a deliberate choice because over time it appeared that an url string is easier to work with in general than an url object. It is probably because a string is a well known primitive while an url object is a more complex structure.

For jsenv, choosing to work with strings simplified the codebase.

## Why prefer url over filesystem path ?

```js
const url = "file:///directory/file.js"
const filesystemPath = "/directory/file.js"
```

In this package functions working with files prefer to receive an url string instead of a filesystem path.

This allows function to manipulate a value that is the same across operating systems. Because on windows a filesystem path looks like `C:\\directory\\file.js` while linux/mac equivalent looks like `/directory/file.js`. Also url are standard. A standard is more robust and knowledge acquired on a standard is reusable.

## API

The functions exported by this package are documented in this part.

### assertAndNormalizeDirectoryUrl

> `assertAndNormalizeDirectoryUrl` is a function ensuring the received value can be normalized to a directory url string.

```js
import { assertAndNormalizeDirectoryUrl } from "@jsenv/util"

assertAndNormalizeDirectoryUrl("/directory")
```

This function is great to make a function accept various values as directory url and normalize it to a standard directory url like `file:///directory/`. Jsenv uses it for every function having a directory url parameter.

— source code at [src/assertAndNormalizeDirectoryUrl.js](./src/assertAndNormalizeDirectoryUrl.js).

### assertAndNormalizeFileUrl

> `assertAndNormalizeFileUrl` is a function ensuring the received value can be normalized to a file url string.

```js
import { assertAndNormalizeFileUrl } from "@jsenv/util"

assertAndNormalizeFileUrl("/directory/file.js")
```

This function is great to make a function accept various values as file url and normalize it to a standard file url like `file:///directory/file.js`. Jsenv uses it for every function having a file url parameter.

— source code at [src/assertAndNormalizeFileUrl.js](./src/assertAndNormalizeFileUrl.js).

### assertDirectoryExists

> `assertDirectoryExists` is an async function throwing if directory does not exists.

```js
import { assertDirectoryExists } from "@jsenv/util"

await assertDirectoryExists("file:///Users/directory/")
```

This function is great to assert a directory existence before going further. Jsenv uses it to throw early when a directory presence is mandatory for a given function to work properly.

— source code at [src/assertDirectoryExists.js](./src/assertDirectoryExists.js).

### assertFileExists

> `assertFileExists` is an async function ensuring a file exists.

```js
import { assertFileExists } from "@jsenv/util"

await assertFileExists("file:///Users/directory/file.js")
```

This function is great to assert a file existence before going further. Jsenv uses it to throw early when a file presence is mandatory for a given function to work properly.

— source code at [src/assertFileExists.js](./src/assertFileExists.js).

### bufferToEtag

> `bufferToEtag` is a function receiving a buffer and converting it into an eTag.

```js
import { bufferToEtag } from "@jsenv/util"

const eTag = bufferToEtag(Buffer.from("Hello world"))
const otherEtag = bufferToEtag(Buffer.from("Hello world"))
eTag === otherEtag
```

This function returns a hash (a small string) representing a file content. You can later check if the file content has changed by comparing a previously generated eTag with the current file content. Jsenv uses it to generate eTag headers and to know if a file content has changed in specific scenarios.

— see [Buffer documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/buffer.html)<br />
— see [eTag documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)<br />
— source code at [src/bufferToEtag.js](./src/bufferToEtag.js).

### cleanDirectory

> `cleanDirectory` is an async function removing all directory content.

```js
import { cleanDirectory } from "@jsenv/util"

await cleanDirectory(`/directory`)
```

This function was written for testing. It is meant to clean up a directory in case a previous test execution let some files and you want to clean them before running your test. Jsenv uses it in some tests involving the filesystem.

— source code at [src/cleanDirectory.js](./src/cleanDirectory.js).

### createDirectory

> `createDirectory` is an async function creating a directory.

```js
import { createDirectory } from "@jsenv/util"

await createDirectory(`/directory`)
```

`createDirectory` is equivalent to [fs.promises.mkdir](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_mkdir_path_options) but accepts url strings as directory path.

— source code at [src/createDirectory.js](./src/createDirectory.js).

### createFileDirectories

> `createFileDirectories` is an async function creating every directory leading to a file.

```js
import { createFileDirectories } from "@jsenv/util"

await createFileDirectories(`/directory/subdirectory/file.js`)
```

This function is useful to ensure a given file directories exists before doing any operation on that file. Jsenv uses it to write file in directories that does not exists yet.

— source code at [src/createFileDirectories.js](./src/createFileDirectories.js).

### fileExists

> `fileExists` is an async function returning a boolean indicating a file presence on the filesystem.

```js
import { fileExists } from "@jsenv/util"

const exists = await fileExists(`/directory/file.js`)
```

This function exists mostly to console.warn in case a file is missing.

— source code at [src/fileExists.js](./src/fileExists.js).

### fileSystemPathToUrl

> `fileSystemPathToUrl` is a function returning a filesystem path from an url string.

```js
import { fileSystemPathToUrl } from "@jsenv/util"

fileSystemPathToUrl("/directory/file.js")
```

`fileSystemPathToUrl` is equivalent to [pathToFileURL from Node.js](https://nodejs.org/docs/latest-v13.x/api/url.html#url_url_pathtofileurl_path) but returns string instead of url objects.

— source code at [src/fileSystemPathToUrl.js](./src/fileSystemPathToUrl.js).

### isFileSystemPath

> `isFileSystemPath` is a function returning a filesystem path from an url string.

```js
import { isFileSystemPath } from "@jsenv/util"

isFileSystemPath("/directory/file.js") // true
isFileSystemPath("C:\\directory\\file.js") // true
isFileSystemPath("directory/file.js") // false
isFileSystemPath("file:///directory/file.js") // false
```

— source code at [src/isFileSystemPath.js](./src/isFileSystemPath.js).

### moveFile

> `moveFile` is an async function moving a file from its current location to an other.

```js
import { moveFile } from "@jsenv/util"

await moveFile("file:///directory/file.js", "file:///destination/file.js")
```

This function will auto create the destination directories if they do not exists.

— source code at [src/moveFile.js](./src/moveFile.js).

### readFileModificationTime

> `readFileModificationTime` is an async function returning a number of milliseconds representing the date when the file was modified.

```js
import { readFileModificationTime } from "@jsenv/util"

const mtimeMs = await readFileModificationTime("file:///directory/file.js")
```

— source code at [src/readFileModificationTime.js](./src/readFileModificationTime.js).

### readFileContent

> `readFileContent` is an async function returning the content of a file as string.

```js
import { readFileContent } from "@jsenv/util"

const content = await readFileContent("file:///directory/file.js")
```

— source code at [src/readFileContent.js](./src/readFileContent.js).

### readFileStat

> `readFileStat` is an async function returning a file stats object.

```js
import { readFileStat } from "@jsenv/util"

const stats = await readFileStat("file:///directory/file.js")
```

`readFileStat` is equivalent to [fs.promises.stats from Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_stat_path_options) but accepts url strings as file path.

— see also [stats object documentation on Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_class_fs_stats)<br />
— source code at [src/readFileStat.js](./src/readFileStat.js).

### removeDirectory

> `removeDirectory` is an async function removing a directory and its content.

```js
import { removeDirectory } from "@jsenv/util"

await removeDirectory("file:///directory/")
```

This function is a wrapper around rimraf.

— see [rimraf on github](https://github.com/isaacs/rimraf/tree/312bf555559f2953606268ef72bf4463bd763efc#api)<br />
— source code at [src/removeDirectory.js](./src/removeDirectory.js).

### removeFile

> `removeFile` is an async function removing a file from the filesystem.

```js
import { removeFile } from "@jsenv/util"

await removeFile("file:///directory/file.js")
```

`removeFile` is equivalent to [fs.promises.unlink from Node.js](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_unlink_path) but accepts url strings as file path.

— source code at [src/removeFile.js](./src/removeFile.js).

### resolveDirectoryUrl

> `resolveDirectoryUrl` is a function resolving a relative url to an absolute directory url string.

```js
import { resolveDirectoryUrl } from "@jsenv/util"

resolveDirectoryUrl("src", "file:///directory")
```

This function applies url resolution and ensure the returned url ends with a slash. Enforcing the trailing slash indicates explicitely that the url is a directory. `file:///directory/whatever/` shows `whatever` is a directory while `file:///directory/whatever` is ambiguous. This specificity helps url resolution against a directory as shown in the code below.

```js
const urlA = new URL("file.js", "file:///directory/")
const urlB = new URL("file.js", "file:///directory")

urlA.href // file:///directory/file.js
urlB.href // file:///file.js
```

— source code at [src/resolveDirectoryUrl.js](./src/resolveDirectoryUrl.js).

### resolveUrl

> `resolveUrl` is a function resolving a relative url to an absolute url string.

```js
import { resolveUrl } from "@jsenv/util"

resolveUrl("file.js", "file:///directory/")
```

As explained before jsenv prefer to work with url string. When it comes to url resolution it implies to write code like `String(new URL(relativeUrl, url))`. But it makes `relativeUrl` and `url` values less readable in the middle of `String(new URL())`. `resolveUrl` exists just to increase code readability.

— source code at [src/resolveUrl.js](./src/resolveUrl.js).

### urlToFileSystemPath

> `urlToFileSystemPath` is a function returning a filesystem path from an url.

```js
import { urlToFileSystemPath } from "@jsenv/util"

urlToFileSystemPath("file:///directory/file.js")
```

`urlToFileSystemPath` is equivalent to [pathToFileURL from Node.js](https://nodejs.org/docs/latest-v13.x/api/url.html#url_url_pathtofileurl_path) but returns string instead of url objects.

— source code at [src/urlToFileSystemPath.js](./src/urlToFileSystemPath.js).

### urlToRelativeUrl

> `urlToRelativeUrl` is a function receiving two absolute urls and returning the first url relative to the second one.

```js
import { urlToRelativeUrl } from "@jsenv/util"

urlToRelativeUrl("file:///directory/file.js", "file:///directory/")
urlToRelativeUrl("http://example.com/directory/file.js", "http://example.com/directory/")
```

`urlToRelativeUrl` is the url equivalent to [path.relative from Node.js](https://nodejs.org/docs/latest-v13.x/api/path.html#path_path_relative_from_to).

— source code at [src/urlToRelativeUrl.js](./src/urlToRelativeUrl.js).

### writeFileContent

> `writeFileContent` is an async function writing file and its content on the filesystem.

```js
import { writeFileContent } from "@jsenv/util"

await writeFileContent("file:///directory/file.txt", "Hello world")
```

This function auto create file parent directories if they do not exists.

— source code at [src/writeFileContent.js](./src/writeFileContent.js).

### writeFileModificationTime

> `writeFileModificationTime` is an async function writing file and its content on the filesystem.

```js
import { writeFileModificationTime } from "@jsenv/util"

await writeFileModificationTime("file:///directory/file.js", Date.now())
```

`writeFileModificationTime` is equivalent to [fs.promises.utimes](https://nodejs.org/docs/latest-v13.x/api/fs.html#fs_fspromises_utimes_path_atime_mtime) but accepts url strings as file path.

— source code at [src/writeFileModificationTime.js](./src/writeFileModificationTime.js).

## Installation

If you never installed a jsenv package, read [Installing a jsenv package](./docs/installing-jsenv-package.md) before going further.

This documentation is up-to-date with a specific version so prefer any of the following commands

```console
npm install @jsenv/util@2.0.0
```

```console
yarn add @jsenv/core@2.0.0
```
