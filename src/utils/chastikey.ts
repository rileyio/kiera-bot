import * as APIUrls from '@/api-urls'
import * as QRCode from 'qrcode'

import { RoutedInteraction, RouterRouted, RouterStats } from '@/router'

import { LockeeDataLock } from 'chastikey.js/app/objects'
import { TrackedChastiKey } from '@/objects/chastikey'
import { Transform } from 'stream'

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

  QRCode.toFileStream(stream, `ChastiKey-Shareable-Lock-!A${code}`, { errorCorrectionLevel: 'high', margin: 3, scale: 5 })
  return stream
}

export async function statsDisabledError(routed: RouterRouted | RoutedInteraction ) {
  // Track incoming message and delete for the target user's privacy
  // await routed.bot.MsgTracker.trackMsg(
  //   new TrackedMessage({
  //     authorID: routed.author.id,
  //     channelId: routed.channel.id,
  //     // Flags
  //     flagAutoDelete: true,
  //     flagTrack: true,
  //     id: routed.message.id,
  //     messageCreatedAt: routed.message.createdAt.getTime(),
  //     // Deletion settings
  //     storageKeepInChatFor: 5000
  //   })
  // )

  // Notify in chat that the user has requested their stats not be public
  return await routed.reply(routed.$render('ChastiKey.Stats.UserRequestedNoStats'), true)
  // await routed.bot.MsgTracker.trackMsg(
  //   new TrackedMessage({
  //     authorID: response.author.id,
  //     channelId: response.channel.id,
  //     // Flags
  //     flagAutoDelete: true,
  //     flagTrack: true,
  //     id: response.id,
  //     messageCreatedAt: response.createdAt.getTime(),
  //     // Deletion settings
  //     storageKeepInChatFor: 15000
  //   })
  // )
}
