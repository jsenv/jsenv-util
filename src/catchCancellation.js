import { isCancelError } from "@jsenv/cancellation"

export const catchCancellation = (asyncFn) => {
  return asyncFn().catch((error) => {
    if (isCancelError(error)) {
      // it means consume of the function will resolve with a cancelError
      // but when you cancel it means you're not interested in the result anymore
      // thanks to this it avoid unhandledRejection
      return error
    }
    throw error
  })
}
