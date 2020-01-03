/* eslint-disable import/max-dependencies */
import { resolveUrl } from "./resolveUrl.js"
import { assertAndNormalizeDirectoryUrl } from "./assertAndNormalizeDirectoryUrl.js"
import { createParentDirectories } from "./createParentDirectories.js"
import { createDirectory } from "./createDirectory.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"
import { copyFileContent } from "./copyFileContent.js"
import { readLStat } from "./readLStat.js"
import { writePermissions } from "./writePermissions.js"
import { writeTimestamps } from "./writeTimestamps.js"
import { readDirectory } from "./readDirectory.js"
import { readSymbolicLink } from "./readSymbolicLink.js"
import { writeSymbolicLink } from "./writeSymbolicLink.js"

export const copyDirectory = async (directoryUrl, directoryDestinationUrl) => {
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl)
  const rootDirectoryDestinationUrl = assertAndNormalizeDirectoryUrl(directoryDestinationUrl)

  await createParentDirectories(directoryDestinationUrl)

  const visit = async (url) => {
    const lstatObject = await readLStat(url)

    if (lstatObject.isDirectory()) {
      await visitDirectory(url, lstatObject.mode)
    } else if (
      lstatObject.isFile() ||
      lstatObject.isCharacterDevice() ||
      lstatObject.isBlockDevice()
    ) {
      await visitFile(url, lstatObject.mode)
    } else if (lstatObject.isSymbolicLink()) {
      await visitSymbolicLink(url, lstatObject.mode)
    }
  }

  const visitDirectory = async (directoryUrl, { mode, atime, mtime }) => {
    const directoryRelativeUrl = urlToRelativeUrl(directoryUrl, rootDirectoryUrl)
    const directoryCopyUrl = resolveUrl(directoryRelativeUrl, rootDirectoryDestinationUrl)

    await createDirectory(directoryCopyUrl)

    await Promise.all([
      Promise.all([
        writePermissions(directoryCopyUrl, mode),
        writeTimestamps(directoryCopyUrl, { atime, mtime }),
      ]),
      copyDirectoryContent(directoryUrl),
    ])
  }
  const visitFile = async (fileUrl, { mode, atime, mtime }) => {
    const fileRelativeUrl = urlToRelativeUrl(fileUrl, rootDirectoryUrl)
    const fileCopyUrl = resolveUrl(fileRelativeUrl, rootDirectoryDestinationUrl)
    await copyFileContent(fileUrl, fileCopyUrl)
    await Promise.all([
      writePermissions(fileCopyUrl, mode),
      writeTimestamps(fileCopyUrl, { atime, mtime }),
    ])
  }

  const visitSymbolicLink = async (symbolicLinkUrl) => {
    const symbolicLinkRelativeUrl = urlToRelativeUrl(symbolicLinkUrl, rootDirectoryUrl)
    const symbolicLinkTargetUrl = await readSymbolicLink(symbolicLinkUrl)
    const symbolicLinkCopyUrl = resolveUrl(symbolicLinkRelativeUrl, rootDirectoryDestinationUrl)
    await writeSymbolicLink(symbolicLinkCopyUrl, symbolicLinkTargetUrl)
  }

  const copyDirectoryContent = async (url) => {
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
