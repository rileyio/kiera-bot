import * as QRCode from 'qrcode'
import { TrackedChastiKey } from '../objects/chastikey';

export namespace ChastiKey {
  export function generateTickerURL(ck: TrackedChastiKey, overrideType?: number) {
    const tickerType = overrideType || ck.ticker.type
    // Break url into parts for easier building
    const fd = `fd=${ck.ticker.date}`
    const un = `un=${ck.username}`
    const ts = `ts=${Date.now()}`
    const r = `r=${ck.ticker.showStarRatingScore ? '1' : '0'}`
    const ext = `ext=.png`

    return `http://www.chastikey.com/tickers/ticker.php?ty=${tickerType}&${ts}&${un}&${fd}&${r}&${ext}`
  }

  export async function generateVerifyQR(code: string) {
    const QRData = await QRCode.toDataURL(code)
  }
}