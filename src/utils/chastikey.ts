import { TrackedChastiKey } from "../objects/chastikey";

export function generateTickerURL(ck: TrackedChastiKey) {
  const date = `${ck.ticker.startDateYY || ''}-${ck.ticker.startDateDD || ''}-${ck.ticker.startDateMM || ''}`

  return `http://www.chastikey.com/tickers/ticker.php?ty=${ck.ticker.type}&st=1&un=${ck.username}&fd=${date}&r=0&ext=.png`
}