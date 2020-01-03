import * as QRCode from 'qrcode'
import * as APIUrls from '@/api-urls'
import { Transform } from 'stream'
import { TrackedChastiKey } from '@/objects/chastikey'
import { RouterStats } from '@/router'
import { LockeeDataLock } from 'chastikey.js/app/objects'

export interface LockeeStats {
  averageLocked: number
  averageRating: number | string
  locks: Array<LockeeDataLock>
  longestLock: number
  monthsLocked: number | string
  noOfRatings: number | string
  totalNoOfCompletedLocks: number
  username: string
  joined: string
  timestampLastActive: number
  // Custom
  additional?: { timeSinceLast: number }
  // For Discord/CK verified check
  isVerified?: boolean
  // From router
  routerStats: RouterStats
}

export namespace ChastiKey {
  export function generateTickerURL(ck: TrackedChastiKey, overrideType?: number) {
    const tickerType = overrideType || ck.ticker.type
    // Break url into parts for easier building
    const fd = `fd=${ck.ticker.date}`
    const un = `un=${ck.username}`
    const ts = `ts=${Date.now()}`
    const r = `r=${ck.ticker.showStarRatingScore ? '1' : '0'}`
    const ext = `ext=.png`

    return `${APIUrls.ChastiKey.Ticker}?ty=${tickerType}&${ts}&${un}&${fd}&${r}&${ext}`
  }

  export function generateVerifyQR(code: string) {
    const stream = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk)
        callback()
      }
    })

    QRCode.toFileStream(stream, `ChastiKey-Shareable-Lock-!A${code}`, { errorCorrectionLevel: 'high', scale: 5, margin: 3 })
    return stream
  }
}
