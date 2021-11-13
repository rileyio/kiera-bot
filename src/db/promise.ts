export async function DBPromise<T>(promise: Promise<T>, fallback: T) {
  try {
    return promise.then((r) => {
      return r
    })
  } catch (error) {
    console.log('### DBPromise Caught')
    return fallback
  }
}
