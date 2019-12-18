export async function DBPromise<T>(promise: Promise<T>, fallback: T) {
  try {
    return promise.then(r => {
      return r
    })
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log('### DBPromise Caught')
    return fallback
  }
}
