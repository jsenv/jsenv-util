/* eslint-disable import/max-dependencies */
import { copyFile as copyFileNode } from "fs"
import { urlTargetsSameFileSystemPath } from "./internal/urlTargetsSameFileSystemPath.js"
import { statsToType } from "./internal/statsToType.js"
import { ensureUrlTrailingSlash } from "./internal/ensureUrlTrailingSlash.js"
import { resolveUrl } from "./resolveUrl.js"
import { binaryFlagsToPermissions } from "./internal/permissions.js"
import { assertAndNormalizeFileUrl } from "./assertAndNormalizeFileUrl.js"
import { writeDirectory } from "./writeDirectory.js"
import { urlToRelativeUrl } from "./urlToRelativeUrl.js"
import { readFileSystemNodeStat } from "./readFileSystemNodeStat.js"
import { ensureParentDirectories } from "./ensureParentDirectories.js"
import { writeFileSystemNodePermissions } from "./writeFileSystemNodePermissions.js"
import { writeFileSystemNodeModificationTime } from "./writeFileSystemNodeModificationTime.js"
import { readDirectory } from "./readDirectory.js"
import { readSymbolicLink } from "./readSymbolicLink.js"
import { writeSymbolicLink } from "./writeSymbolicLink.js"
import { urlIsInsideOf } from "./urlIsInsideOf.js"
import { removeFileSystemNode } from "./removeFileSystemNode.js"
import { urlToFileSystemPath } from "./urlToFileSystemPath.js"

export const copyFileSystemNode = async (
  source,
  destination,
  {
    overwrite = false,
    preserveStat = true,
    preserveMtime = preserveStat,
    preservePermissions = preserveStat,
    allowUseless = false,
    followLink = true,
  } = {},
) => {
  const sourceUrl = assertAndNormalizeFileUrl(source)
  let destinationUrl = assertAndNormalizeFileUrl(destination)
  const sourcePath = urlToFileSystemPath(sourceUrl)

  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followLink: false,
  })
  if (!sourceStats) {
    throw new Error(`nothing to copy at ${sourcePath}`)
  }

  let destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    // we force false here but in fact we will follow the destination link
    // to know where we will actually move and detect useless move overrite etc..
    followLink: false,
  })

  if (followLink && destinationStats && destinationStats.isSymbolicLink()) {
    const target = await readSymbolicLink(destinationUrl)
    destinationUrl = resolveUrl(target, destinationUrl)
    destinationStats = await readFileSystemNodeStat(destinationUrl, { nullIfNotFound: true })
  }
  const destinationPath = urlToFileSystemPath(destinationUrl)

  if (urlTargetsSameFileSystemPath(sourceUrl, destinationUrl)) {
    if (allowUseless) {
      return
    }
    throw new Error(`cannot copy ${sourcePath} because destination and source are the same`)
  }

  if (destinationStats) {
    const sourceType = statsToType(sourceStats)
    const destinationType = statsToType(destinationStats)

    if (sourceType !== destinationType) {
      throw new Error(
        `cannot copy ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and is not a ${sourceType} (it's a ${destinationType})`,
      )
    }
    if (!overwrite) {
      throw new Error(
        `cannot copy ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and overwrite option is disabled`,
      )
    }

    // remove file, link, directory...
    await removeFileSystemNode(destinationUrl, { recursive: true, allowUseless: true })
  } else {
    await ensureParentDirectories(destinationUrl)
  }

  if (sourceStats.isDirectory()) {
    destinationUrl = ensureUrlTrailingSlash(destinationUrl)
  }

  const visit = async (url, stats) => {
    if (stats.isFile() || stats.isCharacterDevice() || stats.isBlockDevice()) {
      await visitFile(url, stats)
    } else if (stats.isSymbolicLink()) {
      await visitSymbolicLink(url, stats)
    } else if (stats.isDirectory()) {
      await visitDirectory(ensureUrlTrailingSlash(url), stats)
    }
  }

  const visitFile = async (fileUrl, fileStats) => {
    const fileRelativeUrl = urlToRelativeUrl(fileUrl, sourceUrl)
    const fileCopyUrl = resolveUrl(fileRelativeUrl, destinationUrl)

    await copyFileContentNaive(urlToFileSystemPath(fileUrl), urlToFileSystemPath(fileCopyUrl))
    await copyStats(fileCopyUrl, fileStats)
  }

  const visitSymbolicLink = async (symbolicLinkUrl) => {
    const symbolicLinkRelativeUrl = urlToRelativeUrl(symbolicLinkUrl, sourceUrl)
    const symbolicLinkTarget = await readSymbolicLink(symbolicLinkUrl)
    const symbolicLinkTargetUrl = resolveUrl(symbolicLinkTarget, symbolicLinkUrl)
    const linkIsRelative =
      symbolicLinkTarget.startsWith("./") || symbolicLinkTarget.startsWith("../")

    let symbolicLinkCopyTarget
    if (symbolicLinkTargetUrl === sourceUrl) {
      symbolicLinkCopyTarget = linkIsRelative ? symbolicLinkTarget : destinationUrl
    } else if (urlIsInsideOf(symbolicLinkTargetUrl, sourceUrl)) {
      // symbolic link targets something inside the directory we want to copy
      // reflects it inside the copied directory structure
      const linkCopyTargetRelative = urlToRelativeUrl(symbolicLinkTargetUrl, sourceUrl)
      symbolicLinkCopyTarget = linkIsRelative
        ? `./${linkCopyTargetRelative}`
        : resolveUrl(linkCopyTargetRelative, destinationUrl)
    } else {
      // symbolic link targets something outside the directory we want to copy
      symbolicLinkCopyTarget = symbolicLinkTarget
    }

    // we must guess ourself the type of the symlink
    // because the destination might not exists because not yet copied
    // https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fs_symlink_target_path_type_callback
    const targetStats = await readFileSystemNodeStat(symbolicLinkTargetUrl, {
      nullIfNotFound: true,
      followLink: false,
    })
    const linkType = targetStats && targetStats.isDirectory() ? "dir" : "file"

    const symbolicLinkCopyUrl = resolveUrl(symbolicLinkRelativeUrl, destinationUrl)
    await writeSymbolicLink(symbolicLinkCopyUrl, symbolicLinkCopyTarget, { type: linkType })
  }

  const copyStats = async (destinationUrl, stats) => {
    if (preservePermissions || preserveMtime) {
      const { mode, mtimeMs } = stats
      if (preservePermissions) {
        await writeFileSystemNodePermissions(destinationUrl, binaryFlagsToPermissions(mode))
      }
      if (preserveMtime) {
        await writeFileSystemNodeModificationTime(destinationUrl, mtimeMs)
      }
    }
  }

  const visitDirectory = async (directoryUrl, directoryStats) => {
    const directoryRelativeUrl = urlToRelativeUrl(directoryUrl, sourceUrl)
    const directoryCopyUrl = resolveUrl(directoryRelativeUrl, destinationUrl)

    await writeDirectory(directoryCopyUrl)
    await copyDirectoryContent(directoryUrl)
    await copyStats(directoryCopyUrl, directoryStats)
  }

  const copyDirectoryContent = async (directoryUrl) => {
    const names = await readDirectory(directoryUrl)
    await Promise.all(
      names.map(async (name) => {
        const fileSystemNodeUrl = resolveUrl(name, directoryUrl)
        const stats = await readFileSystemNodeStat(fileSystemNodeUrl, { followLink: false })
        await visit(fileSystemNodeUrl, stats)
      }),
    )
  }

  await visit(sourceUrl, sourceStats)
}

const copyFileContentNaive = (filePath, fileDestinationPath) => {
  return new Promise((resolve, reject) => {
    copyFileNode(filePath, fileDestinationPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
