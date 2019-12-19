export const urlHasScheme = (string) => {
  return /^[a-zA-Z]{2,}:/.test(string)
}
