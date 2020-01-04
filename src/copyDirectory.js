/* eslint-disable import/max-dependencies */
import { resolveUrl } from "./resolveUrl.js"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { createDirectory } from "./createDirectory.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"
import { copyFile } from "./copyFile.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { readDirectory } from "./readDirectory.js"
import { readSymbolicLink } from "./readSymbolicLink.js"
import { writeSymbolicLink } from "./writeSymbolicLink.js"
import { urlIsInsideOf } from "./urlIsInsideOf.js"

export const copyDirectory = async (directoryUrl, directoryDestinationUrl) => {
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  const rootDirectoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)

  await createParentDirectories(directoryDestinationUrl)

  const visit = async (url) => {
    const filesystemStat = await readLStat(url)

    if (filesystemStat.isDirectory()) {
      await visitDirectory(url, filesystemStat.mode)
    } else if (
      filesystemStat.isFile() ||
      filesystemStat.isCharacterDevice() ||
      filesystemStat.isBlockDevice()
    ) {
      await visitFile(url, filesystemStat.mode)
    } else if (filesystemStat.isSymbolicLink()) {
      await visitSymbolicLink(url, filesystemStat.mode)
    }
  }

  const visitDirectory = async (directoryUrl, { mode, atimeMs, mtimeMs }) => {
    const directoryRelativeUrl = urlToRelativeUrl(directoryUrl, rootDirectoryUrl)
    const directoryCopyUrl = resolveUrl(directoryRelativeUrl, rootDirectoryDestinationUrl)

    await createDirectory(directoryCopyUrl)
    await Promise.all([
      writePermissions(directoryCopyUrl, binaryFlagsToPermissions(mode)),
      copyDirectoryContent(directoryUrl),
    ])
    await writeTimestamps(directoryCopyUrl, { atime: atimeMs, mtime: mtimeMs })
  }

  const visitFile = async (fileUrl, fileStat) => {
    const fileRelativeUrl = urlToRelativeUrl(fileUrl, rootDirectoryUrl)
    const fileCopyUrl = resolveUrl(fileRelativeUrl, rootDirectoryDestinationUrl)
    await copyFile(fileUrl, fileCopyUrl, fileStat)
  }

  const visitSymbolicLink = async (symbolicLinkUrl) => {
    const symbolicLinkRelativeUrl = urlToRelativeUrl(symbolicLinkUrl, rootDirectoryUrl)
    const symbolicLinkTargetUrl = await readSymbolicLink(symbolicLinkUrl)
    const symbolicLinkCopyUrl = resolveUrl(symbolicLinkRelativeUrl, rootDirectoryDestinationUrl)

    let symbolicLinkCopyTargetUrl
    if (symbolicLinkTargetUrl === rootDirectoryUrl) {
      symbolicLinkCopyTargetUrl = rootDirectoryDestinationUrl
    } else if (urlIsInsideOf(symbolicLinkTargetUrl, rootDirectoryUrl)) {
      // symbolic link targets something inside the directory we want to copy
      // reflects it inside the copied directory structure
      symbolicLinkCopyTargetUrl = resolveUrl(
        urlToRelativeUrl(symbolicLinkTargetUrl, rootDirectoryUrl),
        rootDirectoryDestinationUrl,
      )
    } else {
      // symbolic link targets something outside the directory we want to copy
      symbolicLinkCopyTargetUrl = symbolicLinkTargetUrl
    }

    // TODO: handle permission denied to write symbolic link here
    await writeSymbolicLink(symbolicLinkCopyUrl, symbolicLinkCopyTargetUrl)
  }

  const copyDirectoryContent = async (url) => {
    // TODO: handle permission denied to read directory here
    const names = await readDirectory(url)
    await Promise.all(
      names.map(async (name) => {
        const url = resolveUrl(name, url)
        await visit(url)
      }),
    )
  }

  await visit(rootDirectoryUrl)
}
