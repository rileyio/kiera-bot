import * as QRCode from 'qrcode'
import * as APIUrls from '@/api-urls'
import * as Utils from '@/utils'
import { Transform } from 'stream'
import { TrackedChastiKey } from '@/objects/chastikey'
import { RouterStats, RouterRouted } from '@/router'
import { LockeeDataLock } from 'chastikey.js/app/objects'
import { TrackedMessage } from '@/objects/message'
import { Message } from 'discord.js'

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

  export async function statsDisabledError(routed: RouterRouted) {
    // Track incoming message and delete for the target user's privacy
    await routed.bot.MsgTracker.trackMsg(
      new TrackedMessage({
        authorID: routed.message.author.id,
        id: routed.message.id,
        messageCreatedAt: routed.message.createdAt.getTime(),
        channelId: routed.message.channel.id,
        // Flags
        flagAutoDelete: true,
        flagTrack: true,
        // Deletion settings
        storageKeepInChatFor: 5000
      })
    )

    // Notify in chat that the user has requested their stats not be public
    const response = (await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))) as Message
    // Track incoming message and delete for the target user's privacy
    await routed.bot.MsgTracker.trackMsg(
      new TrackedMessage({
        authorID: response.author.id,
        id: response.id,
        messageCreatedAt: response.createdAt.getTime(),
        channelId: response.channel.id,
        // Flags
        flagAutoDelete: true,
        flagTrack: true,
        // Deletion settings
        storageKeepInChatFor: 15000
      })
    )
  }
}
