# Url preference

In this package functions related to filesystem work with url string instead of a filesystem path.

```js
const url = "file:///directory/file.js"
const filesystemPath = "/directory/file.js"
```

This allows function to manipulate a value that is the same across operating systems. Because on windows a filesystem path looks like `C:\\directory\\file.js` while linux/mac equivalent looks like `/directory/file.js`. Also url are standard. A standard is more robust and knowledge acquired on a standard is reusable.
