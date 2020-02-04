import { createCancellationSource } from "@jsenv/cancellation"
import { teardownSignal } from "@jsenv/node-signals"

export const createCancellationTokenForProcess = () => {
  const teardownCancelSource = createCancellationSource()
  teardownSignal.addCallback((reason) => teardownCancelSource.cancel(`process ${reason}`))
  return teardownCancelSource.token
}
