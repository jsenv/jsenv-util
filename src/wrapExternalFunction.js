import { isCancelError } from "@jsenv/cancellation"
import { getCommandArgument } from "./internal/getCommandArgument.js"

export const wrapExternalFunction = (
  fn,
  { catchCancellation = false, unhandledRejectionStrict = false } = {},
) => {
  if (catchCancellation) {
    const previousFn = fn
    fn = async () => {
      try {
        const value = await previousFn()
        return value
      } catch (error) {
        if (isCancelError(error)) {
          // it means consume of the function will resolve with a cancelError
          // but when you cancel it means you're not interested in the result anymore
          // thanks to this it avoid unhandledRejection
          return error
        }
        throw error
      }
    }
  }

  if (unhandledRejectionStrict) {
    const previousFn = fn
    fn = async () => {
      const uninstall = installUnhandledRejectionStrict()
      try {
        const value = await previousFn()
        return value
      } finally {
        uninstall()
      }
    }
  }

  return fn()
}

const installUnhandledRejectionStrict = () => {
  const unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections")
  if (unhandledRejectionArg === "strict") return () => {}

  const onUnhandledRejection = (reason) => {
    throw reason
  }
  process.once("unhandledRejection", onUnhandledRejection)
  return () => {
    process.removeListener("unhandledRejection", onUnhandledRejection)
  }
}
