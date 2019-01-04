import { TrackedChastiKey } from '../objects/chastikey';

export namespace ChastiKey {
  export function generateTickerURL(ck: TrackedChastiKey) {
    const date = `${ck.ticker.startDateYY || ''}-${ck.ticker.startDateDD || ''}-${ck.ticker.startDateMM || ''}`
    const tickerType = ck.ticker.type
    // Break url into parts for easier building
    const fd = `fd=${date}`
    const un = `un=${ck.username}`
    const ts = `ts=${Date.now()}`
    const ext = `ext=.png`

    return `http://www.chastikey.com/tickers/ticker.php?ty=${tickerType}&${ts}&${un}&${fd}&r=0&${ext}`
  }
}