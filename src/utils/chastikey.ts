import { TrackedChastiKey } from '../objects/chastikey';

export namespace ChastiKey {
  export function generateTickerURL(ck: TrackedChastiKey) {
    const date = `${ck.ticker.startDateYY || ''}-${ck.ticker.startDateDD || ''}-${ck.ticker.startDateMM || ''}`
    const tickerType = ck.ticker.type

    return `http://www.chastikey.com/tickers/ticker.php?ty=${tickerType}&st=1&un=${ck.username}&fd=${date}&r=0&ext=.png`
  }
}