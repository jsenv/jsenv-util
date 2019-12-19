export const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing`)
  }
  return String(new URL(specifier, baseUrl))
}
