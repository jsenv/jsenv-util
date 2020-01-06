// source is a directory
// {
//   await writeDirectory(directoryUrl)
//   try {
//     await copyFile(directoryUrl.slice(0, -1), fileDestinationUrl)
//     throw new Error("should throw")
//   } catch (actual) {
//     const expected = new Error(
//       `copyFile must be called on a file, found directory at ${urlToFileSystemPath(
//         directoryUrl.slice(0, -1),
//       )}`,
//     )
//     assert({ actual, expected })
//     await removeFileSystemNode(directoryUrl)
//   }
// }
