// https://nodejs.org/api/fs.html#fs_file_modes
// https://github.com/TooTallNate/stat-mode

import { constants } from "fs"

const {
  S_IRUSR,
  S_IWUSR,
  S_IXUSR,
  S_IRGRP,
  S_IWGRP,
  S_IXGRP,
  S_IROTH,
  S_IWOTH,
  S_IXOTH,
} = constants

export const binaryFlagsToPermissions = (binaryFlags) => {
  const owner = {
    read: Boolean(binaryFlags & S_IRUSR),
    write: Boolean(binaryFlags & S_IWUSR),
    execute: Boolean(binaryFlags & S_IXUSR),
  }

  const group = {
    read: Boolean(binaryFlags & S_IRGRP),
    write: Boolean(binaryFlags & S_IWGRP),
    execute: Boolean(binaryFlags & S_IXGRP),
  }

  const others = {
    read: Boolean(binaryFlags & S_IROTH),
    write: Boolean(binaryFlags & S_IWOTH),
    execute: Boolean(binaryFlags & S_IXOTH),
  }

  return {
    owner,
    group,
    others,
  }
}

export const permissionsToBinaryFlags = ({ owner, group, others }) => {
  let binaryFlags = 0

  if (owner.read) binaryFlags |= S_IRUSR
  if (owner.write) binaryFlags |= S_IWUSR
  if (owner.execute) binaryFlags |= S_IXUSR

  if (group.read) binaryFlags |= S_IRGRP
  if (group.write) binaryFlags |= S_IWGRP
  if (group.execute) binaryFlags |= S_IXGRP

  if (others.read) binaryFlags |= S_IROTH
  if (others.write) binaryFlags |= S_IWOTH
  if (others.execute) binaryFlags |= S_IXOTH

  return binaryFlags
}
