'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var url = require('url');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var util = require('util');

const assertUrlLike = (value, name = "url") => {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a url string, got ${value}`);
  }

  if (isWindowsPathnameSpecifier(value)) {
    throw new TypeError(`${name} must be a url but looks like a windows pathname, got ${value}`);
  }

  if (!hasScheme(value)) {
    throw new TypeError(`${name} must be a url and no scheme found, got ${value}`);
  }
};

const isWindowsPathnameSpecifier = specifier => {
  const firstChar = specifier[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = specifier[1];
  if (secondChar !== ":") return false;
  const thirdChar = specifier[2];
  return thirdChar === "/" || thirdChar === "\\";
};

const hasScheme = specifier => /^[a-zA-Z]+:/.test(specifier);

// https://git-scm.com/docs/gitignore
const applySpecifierPatternMatching = ({
  specifier,
  url,
  ...rest
} = {}) => {
  assertUrlLike(specifier, "specifier");
  assertUrlLike(url, "url");

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
specifier, url`);
  }

  return applyPatternMatching(specifier, url);
};

const applyPatternMatching = (pattern, string) => {
  let patternIndex = 0;
  let index = 0;
  let remainingPattern = pattern;
  let remainingString = string; // eslint-disable-next-line no-constant-condition

  while (true) {
    // pattern consumed and string consumed
    if (remainingPattern === "" && remainingString === "") {
      // pass because string fully matched pattern
      return pass({
        patternIndex,
        index
      });
    } // pattern consumed, string not consumed


    if (remainingPattern === "" && remainingString !== "") {
      // fails because string longer than expected
      return fail({
        patternIndex,
        index
      });
    } // from this point pattern is not consumed
    // string consumed, pattern not consumed


    if (remainingString === "") {
      // pass because trailing "**" is optional
      if (remainingPattern === "**") {
        return pass({
          patternIndex: patternIndex + 2,
          index
        });
      } // fail because string shorted than expected


      return fail({
        patternIndex,
        index
      });
    } // from this point pattern and string are not consumed
    // fast path trailing slash


    if (remainingPattern === "/") {
      // pass because trailing slash matches remaining
      if (remainingString[0] === "/") {
        return pass({
          patternIndex: patternIndex + 1,
          index: string.length
        });
      }

      return fail({
        patternIndex,
        index
      });
    } // fast path trailing '**'


    if (remainingPattern === "**") {
      // pass because trailing ** matches remaining
      return pass({
        patternIndex: patternIndex + 2,
        index: string.length
      });
    } // pattern leading **


    if (remainingPattern.slice(0, 2) === "**") {
      // consumes "**"
      remainingPattern = remainingPattern.slice(2);
      patternIndex += 2;

      if (remainingPattern[0] === "/") {
        // consumes "/"
        remainingPattern = remainingPattern.slice(1);
        patternIndex += 1;
      } // pattern ending with ** always match remaining string


      if (remainingPattern === "") {
        return pass({
          patternIndex,
          index: string.length
        });
      }

      const skipResult = skipUntilMatch({
        pattern: remainingPattern,
        string: remainingString
      });

      if (!skipResult.matched) {
        return fail({
          patternIndex: patternIndex + skipResult.patternIndex,
          index: index + skipResult.index
        });
      }

      return pass({
        patternIndex: pattern.length,
        index: string.length
      });
    }

    if (remainingPattern[0] === "*") {
      // consumes "*"
      remainingPattern = remainingPattern.slice(1);
      patternIndex += 1; // la c'est plus délicat, il faut que remainingString
      // ne soit composé que de truc !== '/'

      if (remainingPattern === "") {
        const slashIndex = remainingString.indexOf("/");

        if (slashIndex > -1) {
          return fail({
            patternIndex,
            index: index + slashIndex
          });
        }

        return pass({
          patternIndex,
          index: string.length
        });
      } // the next char must not the one expected by remainingPattern[0]
      // because * is greedy and expect to skip one char


      if (remainingPattern[0] === remainingString[0]) {
        return fail({
          patternIndex: patternIndex - "*".length,
          index
        });
      }

      const skipResult = skipUntilMatch({
        pattern: remainingPattern,
        string: remainingString,
        skippablePredicate: remainingString => remainingString[0] !== "/"
      });

      if (!skipResult.matched) {
        return fail({
          patternIndex: patternIndex + skipResult.patternIndex,
          index: index + skipResult.index
        });
      }

      return pass({
        patternIndex: pattern.length,
        index: string.length
      });
    }

    if (remainingPattern[0] !== remainingString[0]) {
      return fail({
        patternIndex,
        index
      });
    } // consumes next char


    remainingPattern = remainingPattern.slice(1);
    remainingString = remainingString.slice(1);
    patternIndex += 1;
    index += 1;
    continue;
  }
};

const skipUntilMatch = ({
  pattern,
  string,
  skippablePredicate = () => true
}) => {
  let index = 0;
  let remainingString = string;
  let bestMatch = null; // eslint-disable-next-line no-constant-condition

  while (true) {
    const matchAttempt = applyPatternMatching(pattern, remainingString);

    if (matchAttempt.matched) {
      bestMatch = matchAttempt;
      break;
    }

    const skippable = skippablePredicate(remainingString);
    bestMatch = fail({
      patternIndex: bestMatch ? Math.max(bestMatch.patternIndex, matchAttempt.patternIndex) : matchAttempt.patternIndex,
      index: index + matchAttempt.index
    });

    if (!skippable) {
      break;
    } // search against the next unattempted string


    remainingString = remainingString.slice(matchAttempt.index + 1);
    index += matchAttempt.index + 1;

    if (remainingString === "") {
      bestMatch = { ...bestMatch,
        index: string.length
      };
      break;
    }

    continue;
  }

  return bestMatch;
};

const pass = ({
  patternIndex,
  index
}) => {
  return {
    matched: true,
    index,
    patternIndex
  };
};

const fail = ({
  patternIndex,
  index
}) => {
  return {
    matched: false,
    index,
    patternIndex
  };
};

const isPlainObject = value => {
  if (value === null) {
    return false;
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return false;
    }

    return true;
  }

  return false;
};

const metaMapToSpecifierMetaMap = (metaMap, ...rest) => {
  if (!isPlainObject(metaMap)) {
    throw new TypeError(`metaMap must be a plain object, got ${metaMap}`);
  }

  if (rest.length) {
    throw new Error(`received more arguments than expected.
--- number of arguments received ---
${1 + rest.length}
--- number of arguments expected ---
1`);
  }

  const specifierMetaMap = {};
  Object.keys(metaMap).forEach(metaKey => {
    const specifierValueMap = metaMap[metaKey];

    if (!isPlainObject(specifierValueMap)) {
      throw new TypeError(`metaMap value must be plain object, got ${specifierValueMap} for ${metaKey}`);
    }

    Object.keys(specifierValueMap).forEach(specifier => {
      const metaValue = specifierValueMap[specifier];
      const meta = {
        [metaKey]: metaValue
      };
      specifierMetaMap[specifier] = specifier in specifierMetaMap ? { ...specifierMetaMap[specifier],
        ...meta
      } : meta;
    });
  });
  return specifierMetaMap;
};

const assertSpecifierMetaMap = (value, checkComposition = true) => {
  if (!isPlainObject(value)) {
    throw new TypeError(`specifierMetaMap must be a plain object, got ${value}`);
  }

  if (checkComposition) {
    const plainObject = value;
    Object.keys(plainObject).forEach(key => {
      assertUrlLike(key, "specifierMetaMap key");
      const value = plainObject[key];

      if (value !== null && !isPlainObject(value)) {
        throw new TypeError(`specifierMetaMap value must be a plain object or null, got ${value} under key ${key}`);
      }
    });
  }
};

const normalizeSpecifierMetaMap = (specifierMetaMap, url, ...rest) => {
  assertSpecifierMetaMap(specifierMetaMap, false);
  assertUrlLike(url, "url");

  if (rest.length) {
    throw new Error(`received more arguments than expected.
--- number of arguments received ---
${2 + rest.length}
--- number of arguments expected ---
2`);
  }

  const specifierMetaMapNormalized = {};
  Object.keys(specifierMetaMap).forEach(specifier => {
    const specifierResolved = String(new URL(specifier, url));
    specifierMetaMapNormalized[specifierResolved] = specifierMetaMap[specifier];
  });
  return specifierMetaMapNormalized;
};

const urlCanContainsMetaMatching = ({
  url,
  specifierMetaMap,
  predicate,
  ...rest
}) => {
  assertUrlLike(url, "url"); // the function was meants to be used on url ending with '/'

  if (!url.endsWith("/")) {
    throw new Error(`url should end with /, got ${url}`);
  }

  assertSpecifierMetaMap(specifierMetaMap);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
url, specifierMetaMap, predicate`);
  } // for full match we must create an object to allow pattern to override previous ones


  let fullMatchMeta = {};
  let someFullMatch = false; // for partial match, any meta satisfying predicate will be valid because
  // we don't know for sure if pattern will still match for a file inside pathname

  const partialMatchMetaArray = [];
  Object.keys(specifierMetaMap).forEach(specifier => {
    const meta = specifierMetaMap[specifier];
    const {
      matched,
      index
    } = applySpecifierPatternMatching({
      specifier,
      url
    });

    if (matched) {
      someFullMatch = true;
      fullMatchMeta = { ...fullMatchMeta,
        ...meta
      };
    } else if (someFullMatch === false && index >= url.length) {
      partialMatchMetaArray.push(meta);
    }
  });

  if (someFullMatch) {
    return Boolean(predicate(fullMatchMeta));
  }

  return partialMatchMetaArray.some(partialMatchMeta => predicate(partialMatchMeta));
};

const urlToMeta = ({
  url,
  specifierMetaMap,
  ...rest
} = {}) => {
  assertUrlLike(url);
  assertSpecifierMetaMap(specifierMetaMap);

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
url, specifierMetaMap`);
  }

  return Object.keys(specifierMetaMap).reduce((previousMeta, specifier) => {
    const {
      matched
    } = applySpecifierPatternMatching({
      specifier,
      url
    });

    if (matched) {
      return { ...previousMeta,
        ...specifierMetaMap[specifier]
      };
    }

    return previousMeta;
  }, {});
};

const ensureUrlTrailingSlash = url => {
  return url.endsWith("/") ? url : `${url}/`;
};

const isFileSystemPath = value => {
  if (typeof value !== "string") {
    throw new TypeError(`isFileSystemPath first arg must be a string, got ${value}`);
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter(value);
};

const startsWithWindowsDriveLetter = string => {
  const firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

const fileSystemPathToUrl = value => {
  if (!isFileSystemPath(value)) {
    throw new Error(`received an invalid value for fileSystemPath: ${value}`);
  }

  return String(url.pathToFileURL(value));
};

const assertAndNormalizeDirectoryUrl = value => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError(`directoryUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`directoryUrl must starts with file://, received ${value}`);
  }

  return ensureUrlTrailingSlash(urlString);
};

const assertAndNormalizeFileUrl = (value, baseUrl) => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError(`fileUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`fileUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`fileUrl must starts with file://, received ${value}`);
  }

  return urlString;
};

const statsToType = stats => {
  if (stats.isFile()) return "file";
  if (stats.isDirectory()) return "directory";
  if (stats.isSymbolicLink()) return "symbolic-link";
  if (stats.isFIFO()) return "fifo";
  if (stats.isSocket()) return "socket";
  if (stats.isCharacterDevice()) return "character-device";
  if (stats.isBlockDevice()) return "block-device";
  return undefined;
};

const urlToFileSystemPath = fileUrl => {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  const fileSystemPath = url.fileURLToPath(fileUrl);
  return fileSystemPath;
};

// https://github.com/coderaiser/cloudcmd/issues/63#issuecomment-195478143
// https://nodejs.org/api/fs.html#fs_file_modes
// https://github.com/TooTallNate/stat-mode
// cannot get from fs.constants because they are not available on windows
const S_IRUSR = 256;
/* 0000400 read permission, owner */

const S_IWUSR = 128;
/* 0000200 write permission, owner */

const S_IXUSR = 64;
/* 0000100 execute/search permission, owner */

const S_IRGRP = 32;
/* 0000040 read permission, group */

const S_IWGRP = 16;
/* 0000020 write permission, group */

const S_IXGRP = 8;
/* 0000010 execute/search permission, group */

const S_IROTH = 4;
/* 0000004 read permission, others */

const S_IWOTH = 2;
/* 0000002 write permission, others */

const S_IXOTH = 1;
/* 0000001 execute/search permission, others */

/*
here we could warn that on windows only 0o444 or 0o666 will work

0o444 (readonly)
{
  owner: {read: true, write: false, execute: false},
  group: {read: true, write: false, execute: false},
  others: {read: true, write: false, execute: false},
}

0o666 (read and write)
{
  owner: {read: true, write: true, execute: false},
  group: {read: true, write: true, execute: false},
  others: {read: true, write: true, execute: false},
}
*/

const binaryFlagsToPermissions = binaryFlags => {
  const owner = {
    read: Boolean(binaryFlags & S_IRUSR),
    write: Boolean(binaryFlags & S_IWUSR),
    execute: Boolean(binaryFlags & S_IXUSR)
  };
  const group = {
    read: Boolean(binaryFlags & S_IRGRP),
    write: Boolean(binaryFlags & S_IWGRP),
    execute: Boolean(binaryFlags & S_IXGRP)
  };
  const others = {
    read: Boolean(binaryFlags & S_IROTH),
    write: Boolean(binaryFlags & S_IWOTH),
    execute: Boolean(binaryFlags & S_IXOTH)
  };
  return {
    owner,
    group,
    others
  };
};
const permissionsToBinaryFlags = ({
  owner,
  group,
  others
}) => {
  let binaryFlags = 0;
  if (owner.read) binaryFlags |= S_IRUSR;
  if (owner.write) binaryFlags |= S_IWUSR;
  if (owner.execute) binaryFlags |= S_IXUSR;
  if (group.read) binaryFlags |= S_IRGRP;
  if (group.write) binaryFlags |= S_IWGRP;
  if (group.execute) binaryFlags |= S_IXGRP;
  if (others.read) binaryFlags |= S_IROTH;
  if (others.write) binaryFlags |= S_IWOTH;
  if (others.execute) binaryFlags |= S_IXOTH;
  return binaryFlags;
};

const writeFileSystemNodePermissions = async (source, permissions) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  let binaryFlags;

  if (typeof permissions === "object") {
    permissions = {
      owner: {
        read: getPermissionOrComputeDefault("read", "owner", permissions),
        write: getPermissionOrComputeDefault("write", "owner", permissions),
        execute: getPermissionOrComputeDefault("execute", "owner", permissions)
      },
      group: {
        read: getPermissionOrComputeDefault("read", "group", permissions),
        write: getPermissionOrComputeDefault("write", "group", permissions),
        execute: getPermissionOrComputeDefault("execute", "group", permissions)
      },
      others: {
        read: getPermissionOrComputeDefault("read", "others", permissions),
        write: getPermissionOrComputeDefault("write", "others", permissions),
        execute: getPermissionOrComputeDefault("execute", "others", permissions)
      }
    };
    binaryFlags = permissionsToBinaryFlags(permissions);
  } else {
    binaryFlags = permissions;
  }

  return chmodNaive(sourcePath, binaryFlags);
};

const chmodNaive = (fileSystemPath, binaryFlags) => {
  return new Promise((resolve, reject) => {
    fs.chmod(fileSystemPath, binaryFlags, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const actionLevels = {
  read: 0,
  write: 1,
  execute: 2
};
const subjectLevels = {
  others: 0,
  group: 1,
  owner: 2
};

const getPermissionOrComputeDefault = (action, subject, permissions) => {
  if (subject in permissions) {
    const subjectPermissions = permissions[subject];

    if (action in subjectPermissions) {
      return subjectPermissions[action];
    }

    const actionLevel = actionLevels[action];
    const actionFallback = Object.keys(actionLevels).find(actionFallbackCandidate => actionLevels[actionFallbackCandidate] > actionLevel && actionFallbackCandidate in subjectPermissions);

    if (actionFallback) {
      return subjectPermissions[actionFallback];
    }
  }

  const subjectLevel = subjectLevels[subject]; // do we have a subject with a stronger level (group or owner)
  // where we could read the action permission ?

  const subjectFallback = Object.keys(subjectLevels).find(subjectFallbackCandidate => subjectLevels[subjectFallbackCandidate] > subjectLevel && subjectFallbackCandidate in permissions);

  if (subjectFallback) {
    const subjectPermissions = permissions[subjectFallback];
    return action in subjectPermissions ? subjectPermissions[action] : getPermissionOrComputeDefault(action, subjectFallback, permissions);
  }

  return false;
};

const isWindows = process.platform === "win32";
const readFileSystemNodeStat = async (source, {
  nullIfNotFound = false,
  followLink = true
} = {}) => {
  if (source.endsWith("/")) source = source.slice(0, -1);
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const handleNotFoundOption = nullIfNotFound ? {
    handleNotFoundError: () => null
  } : {};
  return readStat(sourcePath, {
    followLink,
    ...handleNotFoundOption,
    ...(isWindows ? {
      // Windows can EPERM on stat
      handlePermissionDeniedError: async error => {
        console.error(`trying to fix windows EPERM after stats on ${sourcePath}`);

        try {
          // unfortunately it means we mutate the permissions
          // without being able to restore them to the previous value
          // (because reading current permission would also throw)
          await writeFileSystemNodePermissions(sourceUrl, 0o666);
          const stats = await readStat(sourcePath, {
            followLink,
            ...handleNotFoundOption,
            // could not fix the permission error, give up and throw original error
            handlePermissionDeniedError: () => {
              console.error(`still got EPERM after stats on ${sourcePath}`);
              throw error;
            }
          });
          return stats;
        } catch (e) {
          console.error(`error while trying to fix windows EPERM after stats on ${sourcePath}: ${e.stack}`);
          throw error;
        }
      }
    } : {})
  });
};

const readStat = (sourcePath, {
  followLink,
  handleNotFoundError = null,
  handlePermissionDeniedError = null
} = {}) => {
  const nodeMethod = followLink ? fs.stat : fs.lstat;
  return new Promise((resolve, reject) => {
    nodeMethod(sourcePath, (error, statsObject) => {
      if (error) {
        if (handleNotFoundError && error.code === "ENOENT") {
          resolve(handleNotFoundError(error));
        } else if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(statsObject);
      }
    });
  });
};

const assertDirectoryPresence = async source => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true
  });

  if (!sourceStats) {
    throw new Error(`directory not found at ${sourcePath}`);
  }

  if (!sourceStats.isDirectory()) {
    throw new Error(`directory expected at ${sourcePath} and found ${statsToType(sourceStats)} instead`);
  }
};

const assertFilePresence = async source => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true
  });

  if (!sourceStats) {
    throw new Error(`file not found at ${sourcePath}`);
  }

  if (!sourceStats.isFile()) {
    throw new Error(`file expected at ${sourcePath} and found ${statsToType(sourceStats)} instead`);
  }
};

const ETAG_FOR_EMPTY_CONTENT = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
const bufferToEtag = buffer => {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError(`buffer expected, got ${buffer}`);
  }

  if (buffer.length === 0) {
    return ETAG_FOR_EMPTY_CONTENT;
  }

  const hash = crypto.createHash("sha1");
  hash.update(buffer, "utf8");
  const hashBase64String = hash.digest("base64");
  const hashBase64StringSubset = hashBase64String.slice(0, 27);
  const length = buffer.length;
  return `"${length.toString(16)}-${hashBase64StringSubset}"`;
};

const createCancellationToken = () => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    return {
      callback,
      unregister: () => {}
    };
  };

  const throwIfRequested = () => undefined;

  return {
    register,
    cancellationRequested: false,
    throwIfRequested
  };
};

const createOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  ...rest
}) => {
  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

const readDirectory = async (url, {
  emfileMaxWait = 1000
} = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url);
  const directoryPath = urlToFileSystemPath(directoryUrl);
  const startMs = Date.now();
  let attemptCount = 0;

  const attempt = () => {
    return readdirNaive(directoryPath, {
      handleTooManyFilesOpenedError: async error => {
        attemptCount++;
        const nowMs = Date.now();
        const timeSpentWaiting = nowMs - startMs;

        if (timeSpentWaiting > emfileMaxWait) {
          throw error;
        }

        return new Promise(resolve => {
          setTimeout(() => {
            resolve(attempt());
          }, attemptCount);
        });
      }
    });
  };

  return attempt();
};

const readdirNaive = (directoryPath, {
  handleTooManyFilesOpenedError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (error, names) => {
      if (error) {
        // https://nodejs.org/dist/latest-v13.x/docs/api/errors.html#errors_common_system_errors
        if (handleTooManyFilesOpenedError && (error.code === "EMFILE" || error.code === "ENFILE")) {
          resolve(handleTooManyFilesOpenedError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(names);
      }
    });
  });
};

const getCommonPathname = (pathname, otherPathname) => {
  const firstDifferentCharacterIndex = findFirstDifferentCharacterIndex(pathname, otherPathname); // pathname and otherpathname are exactly the same

  if (firstDifferentCharacterIndex === -1) {
    return pathname;
  }

  const commonString = pathname.slice(0, firstDifferentCharacterIndex + 1); // the first different char is at firstDifferentCharacterIndex

  if (pathname.charAt(firstDifferentCharacterIndex) === "/") {
    return commonString;
  }

  if (otherPathname.charAt(firstDifferentCharacterIndex) === "/") {
    return commonString;
  }

  const firstDifferentSlashIndex = commonString.lastIndexOf("/");
  return pathname.slice(0, firstDifferentSlashIndex + 1);
};

const findFirstDifferentCharacterIndex = (string, otherString) => {
  const maxCommonLength = Math.min(string.length, otherString.length);
  let i = 0;

  while (i < maxCommonLength) {
    const char = string.charAt(i);
    const otherChar = otherString.charAt(i);

    if (char !== otherChar) {
      return i;
    }

    i++;
  }

  if (string.length === otherString.length) {
    return -1;
  } // they differ at maxCommonLength


  return maxCommonLength;
};

const pathnameToParentPathname = pathname => {
  const slashLastIndex = pathname.lastIndexOf("/");

  if (slashLastIndex === -1) {
    return "/";
  }

  return pathname.slice(0, slashLastIndex + 1);
};

const urlToRelativeUrl = (urlArg, baseUrlArg) => {
  const url = new URL(urlArg);
  const baseUrl = new URL(baseUrlArg);

  if (url.protocol !== baseUrl.protocol) {
    return urlArg;
  }

  if (url.username !== baseUrl.username || url.password !== baseUrl.password) {
    return urlArg.slice(url.protocol.length);
  }

  if (url.host !== baseUrl.host) {
    return urlArg.slice(url.protocol.length);
  }

  const {
    pathname,
    hash,
    search
  } = url;

  if (pathname === "/") {
    return baseUrl.pathname.slice(1);
  }

  const {
    pathname: basePathname
  } = baseUrl;
  const commonPathname = getCommonPathname(pathname, basePathname);

  if (!commonPathname) {
    return urlArg;
  }

  const specificPathname = pathname.slice(commonPathname.length);
  const baseSpecificPathname = basePathname.slice(commonPathname.length);

  if (baseSpecificPathname.includes("/")) {
    const baseSpecificParentPathname = pathnameToParentPathname(baseSpecificPathname);
    const relativeDirectoriesNotation = baseSpecificParentPathname.replace(/.*?\//g, "../");
    return `${relativeDirectoriesNotation}${specificPathname}${search}${hash}`;
  }

  return `${specificPathname}${search}${hash}`;
};

const comparePathnames = (leftPathame, rightPathname) => {
  const leftPartArray = leftPathame.split("/");
  const rightPartArray = rightPathname.split("/");
  const leftLength = leftPartArray.length;
  const rightLength = rightPartArray.length;
  const maxLength = Math.max(leftLength, rightLength);
  let i = 0;

  while (i < maxLength) {
    const leftPartExists = (i in leftPartArray);
    const rightPartExists = (i in rightPartArray); // longer comes first

    if (!leftPartExists) return +1;
    if (!rightPartExists) return -1;
    const leftPartIsLast = i === leftPartArray.length - 1;
    const rightPartIsLast = i === rightPartArray.length - 1; // folder comes first

    if (leftPartIsLast && !rightPartIsLast) return +1;
    if (!leftPartIsLast && rightPartIsLast) return -1;
    const leftPart = leftPartArray[i];
    const rightPart = rightPartArray[i];
    i++; // local comparison comes first

    const comparison = leftPart.localeCompare(rightPart);
    if (comparison !== 0) return comparison;
  }

  if (leftLength < rightLength) return +1;
  if (leftLength > rightLength) return -1;
  return 0;
};

const collectDirectoryMatchReport = async ({
  cancellationToken = createCancellationToken(),
  directoryUrl,
  specifierMetaMap,
  predicate
}) => {
  const matchingArray = [];
  const ignoredArray = [];
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  const specifierMetaMapNormalized = normalizeSpecifierMetaMap(specifierMetaMap, rootDirectoryUrl);

  const visitDirectory = async directoryUrl => {
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryUrl)
    });
    await Promise.all(directoryItems.map(async directoryItem => {
      const directoryChildNodeUrl = `${directoryUrl}${directoryItem}`;
      const relativeUrl = urlToRelativeUrl(directoryChildNodeUrl, rootDirectoryUrl);
      const directoryChildNodeStats = await createOperation({
        cancellationToken,
        start: () => readFileSystemNodeStat(directoryChildNodeUrl, {
          // we ignore symlink because recursively traversed
          // so symlinked file will be discovered.
          // Moreover if they lead outside of directoryPath it can become a problem
          // like infinite recursion of whatever.
          // that we could handle using an object of pathname already seen but it will be useless
          // because directoryPath is recursively traversed
          followLink: false
        })
      });

      if (directoryChildNodeStats.isDirectory()) {
        const subDirectoryUrl = `${directoryChildNodeUrl}/`;

        if (!urlCanContainsMetaMatching({
          url: subDirectoryUrl,
          specifierMetaMap: specifierMetaMapNormalized,
          predicate
        })) {
          ignoredArray.push({
            relativeUrl: ensureUrlTrailingSlash(relativeUrl),
            fileStats: directoryChildNodeStats
          });
          return;
        }

        await visitDirectory(subDirectoryUrl);
        return;
      }

      if (directoryChildNodeStats.isFile()) {
        const meta = urlToMeta({
          url: directoryChildNodeUrl,
          specifierMetaMap: specifierMetaMapNormalized
        });

        if (!predicate(meta)) {
          ignoredArray.push({
            relativeUrl,
            meta,
            fileStats: directoryChildNodeStats
          });
          return;
        }

        matchingArray.push({
          relativeUrl,
          meta,
          fileStats: directoryChildNodeStats
        });
        return;
      }
    }));
  };

  await visitDirectory(rootDirectoryUrl);
  return {
    matchingArray: sortByRelativeUrl(matchingArray),
    ignoredArray: sortByRelativeUrl(ignoredArray)
  };
};

const sortByRelativeUrl = array => array.sort((left, right) => {
  return comparePathnames(left.relativeUrl, right.relativeUrl);
});

const collectFiles = async ({
  cancellationToken = createCancellationToken(),
  directoryUrl,
  specifierMetaMap,
  predicate,
  matchingFileOperation = () => null
}) => {
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  if (typeof matchingFileOperation !== "function") {
    throw new TypeError(`matchingFileOperation must be a function, got ${matchingFileOperation}`);
  }

  const specifierMetaMapNormalized = normalizeSpecifierMetaMap(specifierMetaMap, rootDirectoryUrl);
  const matchingFileResultArray = [];

  const visitDirectory = async directoryUrl => {
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryUrl)
    });
    await Promise.all(directoryItems.map(async directoryItem => {
      const directoryChildNodeUrl = `${directoryUrl}${directoryItem}`;
      const directoryChildNodeStats = await createOperation({
        cancellationToken,
        start: () => readFileSystemNodeStat(directoryChildNodeUrl, {
          // we ignore symlink because recursively traversed
          // so symlinked file will be discovered.
          // Moreover if they lead outside of directoryPath it can become a problem
          // like infinite recursion of whatever.
          // that we could handle using an object of pathname already seen but it will be useless
          // because directoryPath is recursively traversed
          followLink: false
        })
      });

      if (directoryChildNodeStats.isDirectory()) {
        const subDirectoryUrl = `${directoryChildNodeUrl}/`;

        if (!urlCanContainsMetaMatching({
          url: subDirectoryUrl,
          specifierMetaMap: specifierMetaMapNormalized,
          predicate
        })) {
          return;
        }

        await visitDirectory(subDirectoryUrl);
        return;
      }

      if (directoryChildNodeStats.isFile()) {
        const meta = urlToMeta({
          url: directoryChildNodeUrl,
          specifierMetaMap: specifierMetaMapNormalized
        });
        if (!predicate(meta)) return;
        const relativeUrl = urlToRelativeUrl(directoryChildNodeUrl, rootDirectoryUrl);
        const operationResult = await createOperation({
          cancellationToken,
          start: () => matchingFileOperation({
            cancellationToken,
            relativeUrl,
            meta,
            fileStats: directoryChildNodeStats
          })
        });
        matchingFileResultArray.push({
          relativeUrl,
          meta,
          fileStats: directoryChildNodeStats,
          operationResult
        });
        return;
      }
    }));
  };

  await visitDirectory(rootDirectoryUrl); // When we operate on thoose files later it feels more natural
  // to perform operation in the same order they appear in the filesystem.
  // It also allow to get a predictable return value.
  // For that reason we sort matchingFileResultArray

  matchingFileResultArray.sort((leftFile, rightFile) => {
    return comparePathnames(leftFile.relativeUrl, rightFile.relativeUrl);
  });
  return matchingFileResultArray;
};

const {
  mkdir
} = fs.promises;
const writeDirectory = async (destination, {
  recursive = true,
  allowUseless = false
} = {}) => {
  const destinationUrl = assertAndNormalizeDirectoryUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);
  const destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    followLink: false
  });

  if (destinationStats) {
    if (destinationStats.isDirectory()) {
      if (allowUseless) {
        return;
      }

      throw new Error(`directory already exists at ${destinationPath}`);
    }

    const destinationType = statsToType(destinationStats);
    throw new Error(`cannot write directory at ${destinationPath} because there is a ${destinationType}`);
  }

  try {
    await mkdir(destinationPath, {
      recursive
    });
  } catch (error) {
    if (allowUseless && error.code === "EEXIST") {
      return;
    }

    throw error;
  }
};

const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing to resolve ${specifier}`);
  }

  return String(new URL(specifier, baseUrl));
};

const removeFileSystemNode = async (source, {
  allowUseless = false,
  recursive = false,
  maxRetries = 3,
  retryDelay = 100,
  onlyContent = false
} = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followLink: false
  });

  if (!sourceStats) {
    if (allowUseless) {
      return;
    }

    throw new Error(`nothing to remove at ${urlToFileSystemPath(sourceUrl)}`);
  } // https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_class_fs_stats
  // FIFO and socket are ignored, not sure what they are exactly and what to do with them
  // other libraries ignore them, let's do the same.


  if (sourceStats.isFile() || sourceStats.isSymbolicLink() || sourceStats.isCharacterDevice() || sourceStats.isBlockDevice()) {
    await removeNonDirectory(sourceUrl.endsWith("/") ? sourceUrl.slice(0, -1) : sourceUrl, {
      maxRetries,
      retryDelay
    });
  } else if (sourceStats.isDirectory()) {
    await removeDirectory(ensureUrlTrailingSlash(sourceUrl), {
      recursive,
      maxRetries,
      retryDelay,
      onlyContent
    });
  }
};

const removeNonDirectory = (sourceUrl, {
  maxRetries,
  retryDelay
}) => {
  const sourcePath = urlToFileSystemPath(sourceUrl);
  let retryCount = 0;

  const attempt = () => {
    return unlinkNaive(sourcePath, { ...(retryCount >= maxRetries ? {} : {
        handleTemporaryError: async () => {
          retryCount++;
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(attempt());
            }, retryCount * retryDelay);
          });
        }
      })
    });
  };

  return attempt();
};

const unlinkNaive = (sourcePath, {
  handleTemporaryError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.unlink(sourcePath, error => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve();
        } else if (handleTemporaryError && (error.code === "EBUSY" || error.code === "EMFILE" || error.code === "ENFILE" || error.code === "ENOENT")) {
          resolve(handleTemporaryError(error));
        } else {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
};

const removeDirectory = async (rootDirectoryUrl, {
  maxRetries,
  retryDelay,
  recursive,
  onlyContent
}) => {
  const visit = async sourceUrl => {
    const sourceStats = await readFileSystemNodeStat(sourceUrl, {
      nullIfNotFound: true,
      followLink: false
    }); // file/directory not found

    if (sourceStats === null) {
      return;
    }

    if (sourceStats.isFile() || sourceStats.isCharacterDevice() || sourceStats.isBlockDevice()) {
      await visitFile(sourceUrl);
    } else if (sourceStats.isSymbolicLink()) {
      await visitSymbolicLink(sourceUrl);
    } else if (sourceStats.isDirectory()) {
      await visitDirectory(`${sourceUrl}/`);
    }
  };

  const visitDirectory = async directoryUrl => {
    const directoryPath = urlToFileSystemPath(directoryUrl);
    const optionsFromRecursive = recursive ? {
      handleNotEmptyError: async () => {
        await removeDirectoryContent(directoryUrl);
        await visitDirectory(directoryUrl);
      }
    } : {};
    await removeDirectoryNaive(directoryPath, { ...optionsFromRecursive,
      // Workaround for https://github.com/joyent/node/issues/4337
      ...(process.platform === "win32" ? {
        handlePermissionError: async error => {
          console.error(`trying to fix windows EPERM after readir on ${directoryPath}`);
          let openOrCloseError;

          try {
            const fd = fs.openSync(directoryPath);
            fs.closeSync(fd);
          } catch (e) {
            openOrCloseError = e;
          }

          if (openOrCloseError) {
            if (openOrCloseError.code === "ENOENT") {
              return;
            }

            console.error(`error while trying to fix windows EPERM after readir on ${directoryPath}: ${openOrCloseError.stack}`);
            throw error;
          }

          await removeDirectoryNaive(directoryPath, { ...optionsFromRecursive
          });
        }
      } : {})
    });
  };

  const removeDirectoryContent = async directoryUrl => {
    const names = await readDirectory(directoryUrl);
    await Promise.all(names.map(async name => {
      const url = resolveUrl(name, directoryUrl);
      await visit(url);
    }));
  };

  const visitFile = async fileUrl => {
    await removeNonDirectory(fileUrl, {
      maxRetries,
      retryDelay
    });
  };

  const visitSymbolicLink = async symbolicLinkUrl => {
    await removeNonDirectory(symbolicLinkUrl, {
      maxRetries,
      retryDelay
    });
  };

  if (onlyContent) {
    await removeDirectoryContent(rootDirectoryUrl);
  } else {
    await visitDirectory(rootDirectoryUrl);
  }
};

const removeDirectoryNaive = (directoryPath, {
  handleNotEmptyError = null,
  handlePermissionError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.rmdir(directoryPath, (error, lstatObject) => {
      if (error) {
        if (handlePermissionError && error.code === "EPERM") {
          resolve(handlePermissionError(error));
        } else if (error.code === "ENOENT") {
          resolve();
        } else if (handleNotEmptyError && ( // linux os
        error.code === "ENOTEMPTY" || // SunOS
        error.code === "EEXIST")) {
          resolve(handleNotEmptyError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(lstatObject);
      }
    });
  });
};

const ensureEmptyDirectory = async source => {
  const stats = await readFileSystemNodeStat(source, {
    nullIfNotFound: true,
    followLink: false
  });

  if (stats === null) {
    // if there is nothing, create a directory
    return writeDirectory(source, {
      allowUseless: true
    });
  }

  if (stats.isDirectory()) {
    // if there is a directory remove its content and done
    return removeFileSystemNode(source, {
      allowUseless: true,
      recursive: true,
      onlyContent: true
    });
  }

  const sourceType = statsToType(stats);
  const sourcePath = urlToFileSystemPath(assertAndNormalizeFileUrl(source));
  throw new Error(`ensureEmptyDirectory expect directory at ${sourcePath}, found ${sourceType} instead`);
};

const ensureParentDirectories = async destination => {
  const destinationUrl = assertAndNormalizeFileUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);
  const destinationParentPath = path.dirname(destinationPath);
  return writeDirectory(destinationParentPath, {
    recursive: true,
    allowUseless: true
  });
};

const isWindows$1 = process.platform === "win32";
const baseUrlFallback = fileSystemPathToUrl(process.cwd());
/**
 * Some url might be resolved or remapped to url without the windows drive letter.
 * For instance
 * new URL('/foo.js', 'file:///C:/dir/file.js')
 * resolves to
 * 'file:///foo.js'
 *
 * But on windows it becomes a problem because we need the drive letter otherwise
 * url cannot be converted to a filesystem path.
 *
 * ensureWindowsDriveLetter ensure a resolved url still contains the drive letter.
 */

const ensureWindowsDriveLetter = (url, baseUrl) => {
  try {
    url = String(new URL(url));
  } catch (e) {
    throw new Error(`absolute url expected but got ${url}`);
  }

  if (!isWindows$1) {
    return url;
  }

  try {
    baseUrl = String(new URL(baseUrl));
  } catch (e) {
    throw new Error(`absolute baseUrl expected but got ${baseUrl} to ensure windows drive letter on ${url}`);
  }

  if (!url.startsWith("file://")) {
    return url;
  }

  const afterProtocol = url.slice("file://".length); // we still have the windows drive letter

  if (extractDriveLetter(afterProtocol)) {
    return url;
  } // drive letter was lost, restore it


  const baseUrlOrFallback = baseUrl.startsWith("file://") ? baseUrl : baseUrlFallback;
  const driveLetter = extractDriveLetter(baseUrlOrFallback.slice("file://".length));

  if (!driveLetter) {
    throw new Error(`drive letter expected on baseUrl but got ${baseUrl} to ensure windows drive letter on ${url}`);
  }

  return `file:///${driveLetter}:${afterProtocol}`;
};

const extractDriveLetter = ressource => {
  // we still have the windows drive letter
  if (/[a-zA-Z]/.test(ressource[1]) && ressource[2] === ":") {
    return ressource[1];
  }

  return null;
};

const urlTargetsSameFileSystemPath = (leftUrl, rightUrl) => {
  if (leftUrl.endsWith("/")) leftUrl = leftUrl.slice(0, -1);
  if (rightUrl.endsWith("/")) rightUrl = rightUrl.slice(0, -1);
  return leftUrl === rightUrl;
};

const writeFileSystemNodeModificationTime = (source, mtime) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const mtimeValue = typeof mtime === "number" ? new Date(Math.floor(mtime)) : mtime; // reading atime mutates its value so there is no use case I can think of
  // where we want to modify it

  const atimeValue = mtimeValue;
  return new Promise((resolve, reject) => {
    fs.utimes(sourcePath, atimeValue, mtimeValue, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const replaceBackSlashesWithSlashes = string => string.replace(/\\/g, "/");

const readSymbolicLink = url => {
  const symbolicLinkUrl = assertAndNormalizeFileUrl(url);
  const symbolicLinkPath = urlToFileSystemPath(symbolicLinkUrl);
  return new Promise((resolve, reject) => {
    fs.readlink(symbolicLinkPath, (error, resolvedPath) => {
      if (error) {
        reject(error);
      } else {
        resolve(isFileSystemPath(resolvedPath) ? fileSystemPathToUrl(resolvedPath) : replaceBackSlashesWithSlashes(resolvedPath));
      }
    });
  });
};

const {
  symlink
} = fs.promises;
const isWindows$2 = process.platform === "win32";
const writeSymbolicLink = async (destination, target, {
  type
} = {}) => {
  const destinationUrl = assertAndNormalizeFileUrl(destination);
  let targetValue;

  if (typeof target === "string") {
    // absolute filesystem path
    if (isFileSystemPath(target)) {
      targetValue = target;
    } // relative url
    else if (target.startsWith("./") || target.startsWith("../")) {
        targetValue = target;
      } // absolute url
      else {
          const targetUrl = String(new URL(target, destinationUrl));
          targetValue = urlToFileSystemPath(targetUrl);
        }
  } else if (target instanceof URL) {
    targetValue = urlToFileSystemPath(target);
  } else {
    throw new TypeError(`symbolic link target must be a string or an url, received ${target}`);
  }

  if (isWindows$2 && typeof type !== "string") {
    // without this if you write a symbolic link without specifying the type on windows
    // you later get EPERM when doing stat on the symlink
    const targetUrl = resolveUrl(targetValue, destinationUrl);
    const targetStats = await readFileSystemNodeStat(targetUrl, {
      nullIfNotFound: true
    });
    type = targetStats && targetStats.isDirectory() ? "dir" : "file";
  }

  const symbolicLinkPath = urlToFileSystemPath(destinationUrl);

  try {
    await symlink(targetValue, symbolicLinkPath, type);
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureParentDirectories(destinationUrl);
      await symlink(targetValue, symbolicLinkPath, type);
      return;
    }

    throw error;
  }
};

const urlIsInsideOf = (urlValue, otherUrlValue) => {
  const url = new URL(urlValue);
  const otherUrl = new URL(otherUrlValue);

  if (url.origin !== otherUrl.origin) {
    return false;
  }

  const urlPathname = url.pathname;
  const otherUrlPathname = otherUrl.pathname;

  if (urlPathname === otherUrlPathname) {
    return false;
  }

  return urlPathname.startsWith(otherUrlPathname);
};

/* eslint-disable import/max-dependencies */
const copyFileSystemNode = async (source, destination, {
  overwrite = false,
  preserveStat = true,
  preserveMtime = preserveStat,
  preservePermissions = preserveStat,
  allowUseless = false,
  followLink = true
} = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  let destinationUrl = assertAndNormalizeFileUrl(destination);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followLink: false
  });

  if (!sourceStats) {
    throw new Error(`nothing to copy at ${sourcePath}`);
  }

  let destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    // we force false here but in fact we will follow the destination link
    // to know where we will actually move and detect useless move overrite etc..
    followLink: false
  });

  if (followLink && destinationStats && destinationStats.isSymbolicLink()) {
    const target = await readSymbolicLink(destinationUrl);
    destinationUrl = resolveUrl(target, destinationUrl);
    destinationStats = await readFileSystemNodeStat(destinationUrl, {
      nullIfNotFound: true
    });
  }

  const destinationPath = urlToFileSystemPath(destinationUrl);

  if (urlTargetsSameFileSystemPath(sourceUrl, destinationUrl)) {
    if (allowUseless) {
      return;
    }

    throw new Error(`cannot copy ${sourcePath} because destination and source are the same`);
  }

  if (destinationStats) {
    const sourceType = statsToType(sourceStats);
    const destinationType = statsToType(destinationStats);

    if (sourceType !== destinationType) {
      throw new Error(`cannot copy ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and is not a ${sourceType} (it's a ${destinationType})`);
    }

    if (!overwrite) {
      throw new Error(`cannot copy ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and overwrite option is disabled`);
    } // remove file, link, directory...


    await removeFileSystemNode(destinationUrl, {
      recursive: true,
      allowUseless: true
    });
  } else {
    await ensureParentDirectories(destinationUrl);
  }

  if (sourceStats.isDirectory()) {
    destinationUrl = ensureUrlTrailingSlash(destinationUrl);
  }

  const visit = async (url, stats) => {
    if (stats.isFile() || stats.isCharacterDevice() || stats.isBlockDevice()) {
      await visitFile(url, stats);
    } else if (stats.isSymbolicLink()) {
      await visitSymbolicLink(url);
    } else if (stats.isDirectory()) {
      await visitDirectory(ensureUrlTrailingSlash(url), stats);
    }
  };

  const visitFile = async (fileUrl, fileStats) => {
    const fileRelativeUrl = urlToRelativeUrl(fileUrl, sourceUrl);
    const fileCopyUrl = resolveUrl(fileRelativeUrl, destinationUrl);
    await copyFileContentNaive(urlToFileSystemPath(fileUrl), urlToFileSystemPath(fileCopyUrl));
    await copyStats(fileCopyUrl, fileStats);
  };

  const visitSymbolicLink = async symbolicLinkUrl => {
    const symbolicLinkRelativeUrl = urlToRelativeUrl(symbolicLinkUrl, sourceUrl);
    const symbolicLinkTarget = await readSymbolicLink(symbolicLinkUrl);
    const symbolicLinkTargetUrl = resolveUrl(symbolicLinkTarget, symbolicLinkUrl);
    const linkIsRelative = symbolicLinkTarget.startsWith("./") || symbolicLinkTarget.startsWith("../");
    let symbolicLinkCopyTarget;

    if (symbolicLinkTargetUrl === sourceUrl) {
      symbolicLinkCopyTarget = linkIsRelative ? symbolicLinkTarget : destinationUrl;
    } else if (urlIsInsideOf(symbolicLinkTargetUrl, sourceUrl)) {
      // symbolic link targets something inside the directory we want to copy
      // reflects it inside the copied directory structure
      const linkCopyTargetRelative = urlToRelativeUrl(symbolicLinkTargetUrl, sourceUrl);
      symbolicLinkCopyTarget = linkIsRelative ? `./${linkCopyTargetRelative}` : resolveUrl(linkCopyTargetRelative, destinationUrl);
    } else {
      // symbolic link targets something outside the directory we want to copy
      symbolicLinkCopyTarget = symbolicLinkTarget;
    } // we must guess ourself the type of the symlink
    // because the destination might not exists because not yet copied
    // https://nodejs.org/dist/latest-v13.x/docs/api/fs.html#fs_fs_symlink_target_path_type_callback


    const targetStats = await readFileSystemNodeStat(symbolicLinkTargetUrl, {
      nullIfNotFound: true,
      followLink: false
    });
    const linkType = targetStats && targetStats.isDirectory() ? "dir" : "file";
    const symbolicLinkCopyUrl = resolveUrl(symbolicLinkRelativeUrl, destinationUrl);
    await writeSymbolicLink(symbolicLinkCopyUrl, symbolicLinkCopyTarget, {
      type: linkType
    });
  };

  const copyStats = async (destinationUrl, stats) => {
    if (preservePermissions || preserveMtime) {
      const {
        mode,
        mtimeMs
      } = stats;

      if (preservePermissions) {
        await writeFileSystemNodePermissions(destinationUrl, binaryFlagsToPermissions(mode));
      }

      if (preserveMtime) {
        await writeFileSystemNodeModificationTime(destinationUrl, mtimeMs);
      }
    }
  };

  const visitDirectory = async (directoryUrl, directoryStats) => {
    const directoryRelativeUrl = urlToRelativeUrl(directoryUrl, sourceUrl);
    const directoryCopyUrl = resolveUrl(directoryRelativeUrl, destinationUrl);
    await writeDirectory(directoryCopyUrl);
    await copyDirectoryContent(directoryUrl);
    await copyStats(directoryCopyUrl, directoryStats);
  };

  const copyDirectoryContent = async directoryUrl => {
    const names = await readDirectory(directoryUrl);
    await Promise.all(names.map(async name => {
      const fileSystemNodeUrl = resolveUrl(name, directoryUrl);
      const stats = await readFileSystemNodeStat(fileSystemNodeUrl, {
        followLink: false
      });
      await visit(fileSystemNodeUrl, stats);
    }));
  };

  await visit(sourceUrl, sourceStats);
};

const copyFileContentNaive = (filePath, fileDestinationPath) => {
  return new Promise((resolve, reject) => {
    fs.copyFile(filePath, fileDestinationPath, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const {
  stat
} = fs.promises;
const readFileSystemNodePermissions = async source => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const {
    mode
  } = await stat(sourcePath);
  return binaryFlagsToPermissions(mode);
};

const grantPermissionsOnFileSystemNode = async (source, {
  read = false,
  write = false,
  execute = false
}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const filePermissions = await readFileSystemNodePermissions(sourceUrl);
  await writeFileSystemNodePermissions(sourceUrl, {
    owner: {
      read,
      write,
      execute
    },
    group: {
      read,
      write,
      execute
    },
    others: {
      read,
      write,
      execute
    }
  });
  return async () => {
    await writeFileSystemNodePermissions(sourceUrl, filePermissions);
  };
};

const memoize = compute => {
  let memoized = false;
  let memoizedValue;

  const fnWithMemoization = (...args) => {
    if (memoized) {
      return memoizedValue;
    } // if compute is recursive wait for it to be fully done before storing the value
    // so set memoized boolean after the call


    memoizedValue = compute(...args);
    memoized = true;
    return memoizedValue;
  };

  fnWithMemoization.forget = () => {
    const value = memoizedValue;
    memoized = false;
    memoizedValue = undefined;
    return value;
  };

  return fnWithMemoization;
};

/* eslint-disable import/max-dependencies */
const moveFileSystemNode = async (source, destination, {
  overwrite = false,
  allowUseless = false,
  followLink = true
} = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  let destinationUrl = assertAndNormalizeFileUrl(destination);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const sourceStats = await readFileSystemNodeStat(sourceUrl, {
    nullIfNotFound: true,
    followLink: false
  });

  if (!sourceStats) {
    throw new Error(`nothing to move from ${sourcePath}`);
  }

  let destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    // we force false here but in fact we will follow the destination link
    // to know where we will actually move and detect useless move overrite etc..
    followLink: false
  });

  if (followLink && destinationStats && destinationStats.isSymbolicLink()) {
    const target = await readSymbolicLink(destinationUrl);
    destinationUrl = resolveUrl(target, destinationUrl);
    destinationStats = await readFileSystemNodeStat(destinationUrl, {
      nullIfNotFound: true
    });
  }

  const destinationPath = urlToFileSystemPath(destinationUrl);

  if (urlTargetsSameFileSystemPath(sourceUrl, destinationUrl)) {
    if (allowUseless) {
      return;
    }

    throw new Error(`no move needed for ${sourcePath} because destination and source are the same`);
  }

  if (destinationStats) {
    const sourceType = statsToType(sourceStats);
    const destinationType = statsToType(destinationStats);

    if (sourceType !== destinationType) {
      throw new Error(`cannot move ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and is not a ${sourceType} (it's a ${destinationType})`);
    }

    if (!overwrite) {
      throw new Error(`cannot move ${sourceType} from ${sourcePath} to ${destinationPath} because destination exists and overwrite option is disabled`);
    } // remove file, link, directory...


    await removeFileSystemNode(destinationUrl, {
      recursive: true
    });
  } else {
    await ensureParentDirectories(destinationUrl);
  }

  await moveNaive(sourcePath, destinationPath, {
    handleCrossDeviceError: async () => {
      await copyFileSystemNode(sourceUrl, destinationUrl, {
        preserveStat: true
      });
      await removeFileSystemNode(sourceUrl, {
        recursive: true
      });
    }
  });
};

const moveNaive = (sourcePath, destinationPath, {
  handleCrossDeviceError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.rename(sourcePath, destinationPath, error => {
      if (error) {
        if (handleCrossDeviceError && error.code === "EXDEV") {
          resolve(handleCrossDeviceError(error));
        } else {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
};

const readFilePromisified = util.promisify(fs.readFile);
const readFile = async (value, {
  as = "string"
} = {}) => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFileSystemPath(fileUrl);
  const buffer = await readFilePromisified(filePath);

  if (as === "buffer") {
    return buffer;
  }

  if (as === "string") {
    return buffer.toString();
  }

  if (as === "json") {
    return JSON.parse(buffer.toString());
  }

  throw new Error(`as must be one of buffer,string,json, received ${as}.`);
};

const readFileSystemNodeModificationTime = async source => {
  const stats = await readFileSystemNodeStat(source);
  return Math.floor(stats.mtimeMs);
};

const fileSystemNodeToTypeOrNull = url => {
  const path = urlToFileSystemPath(url);

  try {
    const stats = fs.statSync(path);
    return statsToType(stats);
  } catch (e) {
    if (e.code === "ENOENT") {
      return null;
    }

    throw e;
  }
};

const isWindows$3 = process.platform === "win32";
const createWatcher = (sourcePath, options) => {
  const watcher = fs.watch(sourcePath, options);

  if (isWindows$3) {
    watcher.on("error", async error => {
      // https://github.com/joyent/node/issues/4337
      if (error.code === "EPERM") {
        try {
          const fd = fs.openSync(sourcePath, "r");
          fs.closeSync(fd);
        } catch (e) {
          if (e.code === "ENOENT") {
            return;
          }

          console.error(`error while fixing windows eperm: ${e.stack}`);
          throw error;
        }
      } else {
        throw error;
      }
    });
  }

  return watcher;
};

const trackRessources = () => {
  const callbackArray = [];

  const registerCleanupCallback = callback => {
    if (typeof callback !== "function") throw new TypeError(`callback must be a function
callback: ${callback}`);
    callbackArray.push(callback);
    return () => {
      const index = callbackArray.indexOf(callback);
      if (index > -1) callbackArray.splice(index, 1);
    };
  };

  const cleanup = async reason => {
    const localCallbackArray = callbackArray.slice();
    await Promise.all(localCallbackArray.map(callback => callback(reason)));
  };

  return {
    registerCleanupCallback,
    cleanup
  };
};

/* eslint-disable import/max-dependencies */
const isLinux = process.platform === "linux"; // linux does not support recursive option

const fsWatchSupportsRecursive = !isLinux;
const registerDirectoryLifecycle = (source, {
  added,
  updated,
  removed,
  watchDescription = {
    "./**/*": true
  },
  notifyExistent = false,
  keepProcessAlive = true,
  recursive = false
}) => {
  const sourceUrl = ensureUrlTrailingSlash(assertAndNormalizeFileUrl(source));

  if (!undefinedOrFunction(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`);
  }

  if (!undefinedOrFunction(updated)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`);
  }

  if (!undefinedOrFunction(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`);
  }

  const specifierMetaMap = normalizeSpecifierMetaMap(metaMapToSpecifierMetaMap({
    watch: watchDescription
  }), sourceUrl);

  const entryShouldBeWatched = ({
    relativeUrl,
    type
  }) => {
    const entryUrl = resolveUrl(relativeUrl, sourceUrl);

    if (type === "directory") {
      const canContainEntryToWatch = urlCanContainsMetaMatching({
        url: `${entryUrl}/`,
        specifierMetaMap,
        predicate: ({
          watch
        }) => watch
      });
      return canContainEntryToWatch;
    }

    const entryMeta = urlToMeta({
      url: entryUrl,
      specifierMetaMap
    });
    return entryMeta.watch;
  };

  const tracker = trackRessources();
  const contentMap = new Map();

  const handleDirectoryEvent = ({
    directoryRelativeUrl,
    filename,
    eventType
  }) => {
    if (filename) {
      if (directoryRelativeUrl) {
        handleChange(`${directoryRelativeUrl}/${filename}`);
      } else {
        handleChange(`${filename}`);
      }
    } else if ((removed || added) && eventType === "rename") {
      // we might receive `rename` without filename
      // in that case we try to find ourselves which file was removed.
      let relativeUrlCandidateArray = Array.from(contentMap.keys());

      if (recursive && !fsWatchSupportsRecursive) {
        relativeUrlCandidateArray = relativeUrlCandidateArray.filter(relativeUrlCandidate => {
          if (!directoryRelativeUrl) {
            // ensure entry is top level
            if (relativeUrlCandidate.includes("/")) return false;
            return true;
          } // entry not inside this directory


          if (!relativeUrlCandidate.startsWith(directoryRelativeUrl)) return false;
          const afterDirectory = relativeUrlCandidate.slice(directoryRelativeUrl.length + 1); // deep inside this directory

          if (afterDirectory.includes("/")) return false;
          return true;
        });
      }

      const removedEntryRelativeUrl = relativeUrlCandidateArray.find(relativeUrlCandidate => {
        const entryUrl = resolveUrl(relativeUrlCandidate, sourceUrl);
        const type = fileSystemNodeToTypeOrNull(entryUrl);
        return type === null;
      });

      if (removedEntryRelativeUrl) {
        handleEntryLost({
          relativeUrl: removedEntryRelativeUrl,
          type: contentMap.get(removedEntryRelativeUrl)
        });
      }
    }
  };

  const handleChange = relativeUrl => {
    const entryUrl = resolveUrl(relativeUrl, sourceUrl);
    const previousType = contentMap.get(relativeUrl);
    const type = fileSystemNodeToTypeOrNull(entryUrl);

    if (!entryShouldBeWatched({
      relativeUrl,
      type
    })) {
      return;
    } // it's something new


    if (!previousType) {
      if (type !== null) {
        handleEntryFound({
          relativeUrl,
          type,
          existent: false
        });
      }

      return;
    } // it existed but now it's not here anymore


    if (type === null) {
      handleEntryLost({
        relativeUrl,
        type: previousType
      });
      return;
    } // it existed and was replaced by something else
    // we don't handle this as an update. We rather say the ressource
    // is lost and something else is found (call removed() then added())


    if (previousType !== type) {
      handleEntryLost({
        relativeUrl,
        type: previousType
      });
      handleEntryFound({
        relativeUrl,
        type
      });
      return;
    } // a directory cannot really be updated in way that matters for us
    // filesystem is trying to tell us the directory content have changed
    // but we don't care about that
    // we'll already be notified about what has changed


    if (type === "directory") {
      return;
    } // something has changed at this relativeUrl (the file existed and was not deleted)
    // it's possible to get there and there is no real update
    // (file content is the same and file mtime is the same).
    // In short filesystem is sometimes "lying"
    // Not trying to guard against that because:
    // - hurt perfs a lot
    // - it happens very rarely
    // - it's not really a concern in practice
    // - filesystem did not send an event out of nowhere:
    // something occured but we don't know what with the information we have.


    if (updated) {
      updated({
        relativeUrl,
        type
      });
    }
  };

  const handleEntryFound = ({
    relativeUrl,
    type,
    existent
  }) => {
    if (!entryShouldBeWatched({
      relativeUrl,
      type
    })) {
      return;
    }

    contentMap.set(relativeUrl, type);
    const entryUrl = resolveUrl(relativeUrl, sourceUrl);

    if (type === "directory") {
      visitDirectory({
        directoryUrl: `${entryUrl}/`,
        entryFound: entry => {
          handleEntryFound({
            relativeUrl: `${relativeUrl}/${entry.relativeUrl}`,
            type: entry.type,
            existent
          });
        }
      });
    }

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({
            relativeUrl,
            type,
            existent: true
          });
        }
      } else {
        added({
          relativeUrl,
          type
        });
      }
    } // we must watch manually every directory we find


    if (!fsWatchSupportsRecursive && type === "directory") {
      const watcher = createWatcher(urlToFileSystemPath(entryUrl), {
        persistent: keepProcessAlive
      });
      tracker.registerCleanupCallback(() => {
        watcher.close();
      });
      watcher.on("change", (eventType, filename) => {
        handleDirectoryEvent({
          directoryRelativeUrl: relativeUrl,
          filename: filename ? replaceBackSlashesWithSlashes(filename) : "",
          eventType
        });
      });
    }
  };

  const handleEntryLost = ({
    relativeUrl,
    type
  }) => {
    contentMap.delete(relativeUrl);

    if (removed) {
      removed({
        relativeUrl,
        type
      });
    }
  };

  visitDirectory({
    directoryUrl: sourceUrl,
    entryFound: ({
      relativeUrl,
      type
    }) => {
      handleEntryFound({
        relativeUrl,
        type,
        existent: true
      });
    }
  });
  const watcher = createWatcher(urlToFileSystemPath(sourceUrl), {
    recursive: recursive && fsWatchSupportsRecursive,
    persistent: keepProcessAlive
  });
  tracker.registerCleanupCallback(() => {
    watcher.close();
  });
  watcher.on("change", (eventType, fileSystemPath) => {
    handleDirectoryEvent({ ...fileSystemPathToDirectoryRelativeUrlAndFilename(fileSystemPath),
      eventType
    });
  });
  return tracker.cleanup;
};

const undefinedOrFunction = value => typeof value === "undefined" || typeof value === "function";

const visitDirectory = ({
  directoryUrl,
  entryFound
}) => {
  const directoryPath = urlToFileSystemPath(directoryUrl);
  fs.readdirSync(directoryPath).forEach(entry => {
    const entryUrl = resolveUrl(entry, directoryUrl);
    const type = fileSystemNodeToTypeOrNull(entryUrl);

    if (type === null) {
      return;
    }

    const relativeUrl = urlToRelativeUrl(entryUrl, directoryUrl);
    entryFound({
      relativeUrl,
      type
    });
  });
};

const fileSystemPathToDirectoryRelativeUrlAndFilename = path => {
  if (!path) {
    return {
      directoryRelativeUrl: "",
      filename: ""
    };
  }

  const normalizedPath = replaceBackSlashesWithSlashes(path);
  const slashLastIndex = normalizedPath.lastIndexOf("/");

  if (slashLastIndex === -1) {
    return {
      directoryRelativeUrl: "",
      filename: normalizedPath
    };
  }

  const directoryRelativeUrl = normalizedPath.slice(0, slashLastIndex);
  const filename = normalizedPath.slice(slashLastIndex + 1);
  return {
    directoryRelativeUrl,
    filename
  };
};

const registerFileLifecycle = (source, {
  added,
  updated,
  removed,
  notifyExistent = false,
  keepProcessAlive = true
}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);

  if (!undefinedOrFunction$1(added)) {
    throw new TypeError(`added must be a function or undefined, got ${added}`);
  }

  if (!undefinedOrFunction$1(updated)) {
    throw new TypeError(`updated must be a function or undefined, got ${updated}`);
  }

  if (!undefinedOrFunction$1(removed)) {
    throw new TypeError(`removed must be a function or undefined, got ${removed}`);
  }

  const tracker = trackRessources();

  const handleFileFound = ({
    existent
  }) => {
    const fileMutationStopWatching = watchFileMutation(sourceUrl, {
      updated,
      removed: () => {
        fileMutationStopTracking();
        watchFileAdded();

        if (removed) {
          removed();
        }
      },
      keepProcessAlive
    });
    const fileMutationStopTracking = tracker.registerCleanupCallback(fileMutationStopWatching);

    if (added) {
      if (existent) {
        if (notifyExistent) {
          added({
            existent: true
          });
        }
      } else {
        added({});
      }
    }
  };

  const watchFileAdded = () => {
    const fileCreationStopWatching = watchFileCreation(sourceUrl, () => {
      fileCreationgStopTracking();
      handleFileFound({
        existent: false
      });
    }, keepProcessAlive);
    const fileCreationgStopTracking = tracker.registerCleanupCallback(fileCreationStopWatching);
  };

  const sourceType = fileSystemNodeToTypeOrNull(sourceUrl);

  if (sourceType === null) {
    if (added) {
      watchFileAdded();
    } else {
      throw new Error(`${urlToFileSystemPath(sourceUrl)} must lead to a file, found nothing`);
    }
  } else if (sourceType === "file") {
    handleFileFound({
      existent: true
    });
  } else {
    throw new Error(`${urlToFileSystemPath(sourceUrl)} must lead to a file, type found instead`);
  }

  return tracker.cleanup;
};

const undefinedOrFunction$1 = value => typeof value === "undefined" || typeof value === "function";

const watchFileCreation = (source, callback, keepProcessAlive) => {
  const sourcePath = urlToFileSystemPath(source);
  const sourceFilename = path.basename(sourcePath);
  const directoryPath = path.dirname(sourcePath);
  let directoryWatcher = createWatcher(directoryPath, {
    persistent: keepProcessAlive
  });
  directoryWatcher.on("change", (eventType, filename) => {
    if (filename && filename !== sourceFilename) return;
    const type = fileSystemNodeToTypeOrNull(source); // ignore if something else with that name gets created
    // we are only interested into files

    if (type !== "file") return;
    directoryWatcher.close();
    directoryWatcher = undefined;
    callback();
  });
  return () => {
    if (directoryWatcher) {
      directoryWatcher.close();
    }
  };
};

const watchFileMutation = (sourceUrl, {
  updated,
  removed,
  keepProcessAlive
}) => {
  let watcher = createWatcher(urlToFileSystemPath(sourceUrl), {
    persistent: keepProcessAlive
  });
  watcher.on("change", () => {
    const sourceType = fileSystemNodeToTypeOrNull(sourceUrl);

    if (sourceType === null) {
      watcher.close();
      watcher = undefined;

      if (removed) {
        removed();
      }
    } else if (sourceType === "file") {
      if (updated) {
        updated();
      }
    }
  });
  return () => {
    if (watcher) {
      watcher.close();
    }
  };
};

const resolveDirectoryUrl = (specifier, baseUrl) => {
  const url = resolveUrl(specifier, baseUrl);
  return ensureUrlTrailingSlash(url);
};

const {
  access
} = fs.promises;
const {
  // F_OK,
  R_OK,
  W_OK,
  X_OK
} = fs.constants;
const testFileSystemNodePermissions = async (source, {
  read = false,
  write = false,
  execute = false,
  allowedIfNotFound = false
} = {}) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  let binaryFlags = 0; // if (visible) binaryFlags |= F_OK

  if (read) binaryFlags |= R_OK;
  if (write) binaryFlags |= W_OK;
  if (execute) binaryFlags |= X_OK;

  try {
    await access(sourcePath, binaryFlags);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      if (allowedIfNotFound) {
        return true;
      }

      throw error;
    }

    return false;
  }
};

const urlToScheme = urlString => {
  const colonIndex = urlString.indexOf(":");

  if (colonIndex === -1) {
    return "";
  }

  const scheme = urlString.slice(0, colonIndex);
  return scheme;
};

const urlToRessource = urlString => {
  const scheme = urlToScheme(urlString);

  if (scheme === "file") {
    return urlString.slice("file://".length);
  }

  if (scheme === "https" || scheme === "http") {
    // remove origin
    const afterProtocol = urlString.slice(scheme.length + "://".length);
    const pathnameSlashIndex = afterProtocol.indexOf("/", "://".length);
    return afterProtocol.slice(pathnameSlashIndex);
  }

  return urlString.slice(scheme.length + 1);
};

const urlToPathname = urlString => {
  const ressource = urlToRessource(urlString);
  const pathname = ressourceToPathname(ressource);
  return pathname;
};

const ressourceToPathname = ressource => {
  const searchSeparatorIndex = ressource.indexOf("?");
  return searchSeparatorIndex === -1 ? ressource : ressource.slice(0, searchSeparatorIndex);
};

const urlToFilename = url => {
  const pathname = urlToPathname(url);
  const slashLastIndex = pathname.lastIndexOf("/");
  const filename = slashLastIndex === -1 ? pathname : pathname.slice(slashLastIndex + 1);
  return filename;
};

const urlToBasename = pathname => {
  const filename = urlToFilename(pathname);
  const dotLastIndex = filename.lastIndexOf(".");
  const basename = dotLastIndex === -1 ? filename : filename.slice(0, dotLastIndex);
  return basename;
};

const urlToExtension = url => {
  const pathname = urlToPathname(url);
  return pathnameToExtension(pathname);
};

const pathnameToExtension = pathname => {
  const slashLastIndex = pathname.lastIndexOf("/");

  if (slashLastIndex !== -1) {
    pathname = pathname.slice(slashLastIndex + 1);
  }

  const dotLastIndex = pathname.lastIndexOf(".");
  if (dotLastIndex === -1) return ""; // if (dotLastIndex === pathname.length - 1) return ""

  const extension = pathname.slice(dotLastIndex);
  return extension;
};

const urlToOrigin = url => {
  if (url.startsWith("file://")) {
    return `file://`;
  }

  return new URL(url).origin;
};

const urlToParentUrl = url => {
  const ressource = urlToRessource(url);
  const slashLastIndex = ressource.lastIndexOf("/");

  if (slashLastIndex === -1) {
    return url;
  }

  const lastCharacterIndex = ressource.length - 1;

  if (slashLastIndex === lastCharacterIndex) {
    const slashPreviousIndex = ressource.lastIndexOf("/", lastCharacterIndex - 1);

    if (slashPreviousIndex === -1) {
      return url;
    }

    const origin = urlToOrigin(url);
    return `${origin}${ressource.slice(0, slashPreviousIndex + 1)}`;
  }

  const origin = urlToOrigin(url);
  return `${origin}${ressource.slice(0, slashLastIndex + 1)}`;
};

const {
  writeFile: writeFileNode
} = fs.promises;
const writeFile = async (destination, content = "") => {
  const destinationUrl = assertAndNormalizeFileUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);

  try {
    await writeFileNode(destinationPath, content);
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureParentDirectories(destinationUrl);
      await writeFileNode(destinationPath, content);
      return;
    }

    throw error;
  }
};

exports.applySpecifierPatternMatching = applySpecifierPatternMatching;
exports.assertAndNormalizeDirectoryUrl = assertAndNormalizeDirectoryUrl;
exports.assertAndNormalizeFileUrl = assertAndNormalizeFileUrl;
exports.assertDirectoryPresence = assertDirectoryPresence;
exports.assertFilePresence = assertFilePresence;
exports.bufferToEtag = bufferToEtag;
exports.collectDirectoryMatchReport = collectDirectoryMatchReport;
exports.collectFiles = collectFiles;
exports.comparePathnames = comparePathnames;
exports.copyFileSystemNode = copyFileSystemNode;
exports.ensureEmptyDirectory = ensureEmptyDirectory;
exports.ensureParentDirectories = ensureParentDirectories;
exports.ensureWindowsDriveLetter = ensureWindowsDriveLetter;
exports.fileSystemPathToUrl = fileSystemPathToUrl;
exports.grantPermissionsOnFileSystemNode = grantPermissionsOnFileSystemNode;
exports.isFileSystemPath = isFileSystemPath;
exports.memoize = memoize;
exports.metaMapToSpecifierMetaMap = metaMapToSpecifierMetaMap;
exports.moveFileSystemNode = moveFileSystemNode;
exports.normalizeSpecifierMetaMap = normalizeSpecifierMetaMap;
exports.readDirectory = readDirectory;
exports.readFile = readFile;
exports.readFileSystemNodeModificationTime = readFileSystemNodeModificationTime;
exports.readFileSystemNodePermissions = readFileSystemNodePermissions;
exports.readFileSystemNodeStat = readFileSystemNodeStat;
exports.readSymbolicLink = readSymbolicLink;
exports.registerDirectoryLifecycle = registerDirectoryLifecycle;
exports.registerFileLifecycle = registerFileLifecycle;
exports.removeFileSystemNode = removeFileSystemNode;
exports.resolveDirectoryUrl = resolveDirectoryUrl;
exports.resolveUrl = resolveUrl;
exports.testFileSystemNodePermissions = testFileSystemNodePermissions;
exports.urlCanContainsMetaMatching = urlCanContainsMetaMatching;
exports.urlIsInsideOf = urlIsInsideOf;
exports.urlToBasename = urlToBasename;
exports.urlToExtension = urlToExtension;
exports.urlToFileSystemPath = urlToFileSystemPath;
exports.urlToFilename = urlToFilename;
exports.urlToMeta = urlToMeta;
exports.urlToOrigin = urlToOrigin;
exports.urlToParentUrl = urlToParentUrl;
exports.urlToPathname = urlToPathname;
exports.urlToRelativeUrl = urlToRelativeUrl;
exports.urlToRessource = urlToRessource;
exports.urlToScheme = urlToScheme;
exports.writeDirectory = writeDirectory;
exports.writeFile = writeFile;
exports.writeFileSystemNodeModificationTime = writeFileSystemNodeModificationTime;
exports.writeFileSystemNodePermissions = writeFileSystemNodePermissions;
exports.writeSymbolicLink = writeSymbolicLink;

//# sourceMappingURL=main.cjs.map