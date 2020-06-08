import { wrapExternalFunction } from "./wrapExternalFunction.js"

export const catchCancellation = (asyncFn) =>
  wrapExternalFunction(asyncFn, { catchCancellation: true })
