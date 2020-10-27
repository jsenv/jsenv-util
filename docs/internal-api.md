An hidden documentation for exported function that are for advanced use case.

# Table of contents

- [catchCancellation](#catchCancellation)

# catchCancellation

`catchCancellation` is a function receiving an async function and immediatly calling it and catching cancelError to avoid unhandled rejection.

Considering that cancelling a function rejects it rejected with a cancel error.

```js
import { createCancellationSource, isCancelError } from "@jsenv/cancellation"

const fn = async ({ cancellationToken }) => {
  cancellationToken.throwIfRequested()
}

const cancelSource = createCancellationSource()
cancelSource.cancel()

try {
  await fn({ cancellationToken: cancelSource.token })
} catch (e) {
  isCancelError(e) // true
}
```

You have to catch the cancel errors to avoid unhandled rejection inside Node.js. `catchCancellation` resolves with the cancel error instead of rejecting with it to avoid the unhandledRejection. You can still detect the cancellation using isCancelError(result) but cancellation means you're no longer interested in the result so you shoud not need this at all.

```js
import { catchCancellation } from "@jsenv/util"
import { createCancellationSource, isCancelError } from "@jsenv/cancellation"

const fn = async ({ cancellationToken }) => {
  cancellationToken.throwIfRequested()
}

const cancelSource = createCancellationSource()
cancelSource.cancel()

const result = await catchCancellation(() => fn({ cancellationToken: cancelSource.token }))
isCancelError(result) // true
```

— source code at [src/catchCancellation.js](./src/catchCancellation.js).
