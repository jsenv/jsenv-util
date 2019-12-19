'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var url$1 = require('url');
var fs = require('fs');
var path = require('path');
var util = require('util');

const urlHasScheme = string => {
  return /^[a-zA-Z]{2,}:/.test(string);
};

const filePathToUrl = path => {
  return path.startsWith("file://") ? path : String(url$1.pathToFileURL(path));
};

const ensureUrlTrailingSlash = url => {
  return url.endsWith("/") ? url : `${url}/`;
};

const assertAndNormalizeDirectoryUrl = value => {
  if (value instanceof URL) {
    value = value.href;
  }

  if (typeof value === "string") {
    const url = urlHasScheme(value) ? value : filePathToUrl(value);

    if (!url.startsWith("file://")) {
      throw new Error(`directoryUrl must starts with file://, received ${value}`);
    }

    return ensureUrlTrailingSlash(url);
  }

  throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
};

const assertAndNormalizeFileUrl = value => {
  if (value instanceof URL) {
    value = value.href;
  }

  if (typeof value === "string") {
    const url = urlHasScheme(value) ? value : filePathToUrl(value);

    if (!url.startsWith("file://")) {
      throw new Error(`fileUrl must starts with file://, received ${value}`);
    }

    return url;
  }

  throw new TypeError(`fileUrl must be a string or an url, received ${value}`);
};

const urlToFilePath = fileUrl => {
  return url$1.fileURLToPath(fileUrl);
};

const assertDirectoryExists = async value => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value);
  const directoryPath = urlToFilePath(directoryUrl);
  const filesystemEntry = await pathToFilesystemEntry(directoryPath);

  if (!filesystemEntry) {
    throw new Error(`directory not found at ${directoryPath}`);
  }

  const {
    type
  } = filesystemEntry;

  if (type !== "folder") {
    throw new Error(`directory expected at ${directoryPath} but found ${type}`);
  }
};

const pathToFilesystemEntry = path => new Promise((resolve, reject) => {
  fs.stat(path, (error, stats) => {
    if (error) {
      if (error.code === "ENOENT") resolve(null);else reject(error);
    } else {
      resolve({
        // eslint-disable-next-line no-nested-ternary
        type: stats.isFile() ? "file" : stats.isDirectory() ? "folder" : "other",
        stats
      });
    }
  });
});

const assertFileExists = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  const filesystemEntry = await pathToFilesystemEntry$1(filePath);

  if (!filesystemEntry) {
    throw new Error(`file not found at ${filePath}`);
  }

  const {
    type
  } = filesystemEntry;

  if (type !== "file") {
    throw new Error(`file expected at ${filePath} but found ${type}`);
  }
};

const pathToFilesystemEntry$1 = path => new Promise((resolve, reject) => {
  fs.stat(path, (error, stats) => {
    if (error) {
      if (error.code === "ENOENT") resolve(null);else reject(error);
    } else {
      resolve({
        // eslint-disable-next-line no-nested-ternary
        type: stats.isFile() ? "file" : stats.isDirectory() ? "folder" : "other",
        stats
      });
    }
  });
});

const createFileDirectories = filePath => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path.dirname(filePath), {
      recursive: true
    }, error => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve();
          return;
        }

        reject(error);
        return;
      }

      resolve();
    });
  });
};

// the error.code === 'ENOENT' shortcut that avoids
// throwing any error

const fileExists = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  return new Promise((resolve, reject) => {
    fs.stat(filePath, error => {
      if (error) {
        if (error.code === "ENOENT") resolve(false);else reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

const readFilePromisified = util.promisify(fs.readFile);
const readFileContent = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  const buffer = await readFilePromisified(filePath);
  return buffer.toString();
};

const statPromisified = util.promisify(fs.stat);
const readFileStat = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  const statsObject = await statPromisified(filePath);
  return statsObject;
};

// eslint-disable-next-line import/no-unresolved
const nodeRequire = require;
const filenameContainsBackSlashes = __filename.indexOf("\\") > -1;
const url = filenameContainsBackSlashes ? `file:///${__filename.replace(/\\/g, "/")}` : `file://${__filename}`;

const rimraf = nodeRequire("rimraf");

const removeDirectory = value => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(value);
  const directoryPath = urlToFilePath(directoryUrl);
  return new Promise((resolve, reject) => rimraf(directoryPath, error => {
    if (error) reject(error);else resolve();
  }));
};

const removeFile = value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing`);
  }

  return String(new URL(specifier, baseUrl));
};

const urlsHaveSameOrigin = (url, otherUrl) => {
  return new URL(url).origin === new URL(otherUrl).origin;
};

const urlToRelativePath = (fileUrl, baseFileUrl) => {
  // https://stackoverflow.com/a/31024574/2634179
  const fromPath = baseFileUrl.endsWith("/") ? urlToFilePath(baseFileUrl) : path.dirname(urlToFilePath(baseFileUrl));
  const toPath = urlToFilePath(fileUrl);
  const relativePath = path.relative(fromPath, toPath);
  return replaceBackSlashesWithSlashes(relativePath);
};

const replaceBackSlashesWithSlashes = string => string.replace(/\\/g, "/");

const urlToRelativeUrl = (url, baseUrl) => {
  if (typeof baseUrl !== "string") {
    throw new TypeError(`baseUrl must be a string, got ${baseUrl}`);
  }

  if (url.startsWith(baseUrl)) {
    // we should take into account only pathname
    // and ignore search params
    return url.slice(baseUrl.length);
  }

  return url;
};

const writeFilePromisified = util.promisify(fs.writeFile);
const writeFileContent = async (value, content) => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFilePath(fileUrl);
  await createFileDirectories(filePath);
  return writeFilePromisified(filePath, content);
};

exports.assertAndNormalizeDirectoryUrl = assertAndNormalizeDirectoryUrl;
exports.assertAndNormalizeFileUrl = assertAndNormalizeFileUrl;
exports.assertDirectoryExists = assertDirectoryExists;
exports.assertFileExists = assertFileExists;
exports.createFileDirectories = createFileDirectories;
exports.ensureUrlTrailingSlash = ensureUrlTrailingSlash;
exports.fileExists = fileExists;
exports.filePathToUrl = filePathToUrl;
exports.readFileContent = readFileContent;
exports.readFileStat = readFileStat;
exports.removeDirectory = removeDirectory;
exports.removeFile = removeFile;
exports.resolveUrl = resolveUrl;
exports.urlHasScheme = urlHasScheme;
exports.urlToFilePath = urlToFilePath;
exports.urlToRelativePath = urlToRelativePath;
exports.urlToRelativeUrl = urlToRelativeUrl;
exports.urlsHaveSameOrigin = urlsHaveSameOrigin;
exports.writeFileContent = writeFileContent;
//# sourceMappingURL=main.js.map
