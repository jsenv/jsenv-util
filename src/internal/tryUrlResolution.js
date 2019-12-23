export const tryUrlResolution = (value) => {
  try {
    return new URL(value)
  } catch (e) {
    return null
  }
}
