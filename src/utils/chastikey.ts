import * as QRCode from 'qrcode'
import * as APIUrls from '@/api-urls'
import * as Utils from '@/utils'
import { Transform } from 'stream'
import { TrackedChastiKey, TrackedChastiKeyUser, TrackedChastiKeyUserAPIFetchLock, TrackedChastiKeyLockee, TrackedChastiKeyLock } from '@/objects/chastikey'
import { LockeeStats } from '@/embedded/chastikey-stats'
import { RouterStats } from '@/router'

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

  export function compileLockeeStats(
    ckUser: TrackedChastiKeyUser,
    userInLockeeStats: TrackedChastiKeyLockee,
    cachedActiveLocks: Array<TrackedChastiKeyLock>,
    locks: Array<TrackedChastiKeyUserAPIFetchLock>,
    routerStats: RouterStats
  ): LockeeStats {
    // Variables - Defaults (unless changed later)
    var calculatedCumulative = 0
    var calculatedTimeSinceLastLock = 0
    var allLockeesLocks = locks
    var allLockeesLocksTransformed: Array<{ start: number; end: number }> = []

    try {
      // For any dates with a { ... end: 0 } set the 0 to the current timestamp (still active)
      allLockeesLocks.map(d => {
        const lockIsAbandoned = d.lockDeleted === 1 && d.timestampUnlocked === 0
        // Remove unlocked time if the lock status is: Locked, Deleted and has a Completion timestamp
        if (d.timestampUnlocked > 0 && d.status === 'Locked' && d.lockDeleted === 1) {
          // console.log('set to:', 0)
          d.timestampUnlocked = 0
        }

        if (d.timestampUnlocked === 0 && (d.status === 'Locked' || d.status === 'ReadyToUnlock') && d.lockDeleted === 0) {
          // console.log('set to:', Math.round(Date.now() / 1000))
          d.timestampUnlocked = Math.round(Date.now() / 1000)
        }

        // Find newest lock ended - only if no locks are active
        if (cachedActiveLocks.length === 0) {
          calculatedTimeSinceLastLock = d.timestampUnlocked > calculatedTimeSinceLastLock ? d.timestampUnlocked : calculatedTimeSinceLastLock
        }

        // Only include Non-Abandoned locks in the calculation
        if (!lockIsAbandoned) {
          // Transform data a little
          allLockeesLocksTransformed.push({ start: d.timestampLocked, end: d.timestampUnlocked })
        }
      })

      // Calculate cumulative using algorithm
      var cumulativeCalc = Utils.Date.calculateCumulativeRange(allLockeesLocksTransformed)
      calculatedCumulative = Math.round((cumulativeCalc.cumulative / 2592000) * 100) / 100
      // Calculate average
      // console.log('!!! Average:', cumulativeCalc.average)
      // console.log('!!! Average:', Utils.Date.calculateHumanTimeDDHHMM(cumulativeCalc.average))
      userInLockeeStats.averageTimeLockedInSeconds = cumulativeCalc.average
      // console.log('!!!!!!!!!!Got this far!')
    } catch (error) {
      calculatedCumulative = NaN
      console.log('CK stats lockee Error building cumulative time')
    }

    return {
      averageLocked: userInLockeeStats ? userInLockeeStats.averageTimeLockedInSeconds : 0,
      averageRating: userInLockeeStats ? userInLockeeStats.averageRating : '-',
      locks: cachedActiveLocks,
      longestLock: userInLockeeStats ? userInLockeeStats.longestCompletedLockInSeconds : 0,
      monthsLocked: calculatedCumulative,
      noOfRatings: userInLockeeStats ? userInLockeeStats.noOfRatings : 0,
      totalNoOfCompletedLocks: userInLockeeStats ? userInLockeeStats.totalNoOfCompletedLocks : 0,
      username: ckUser.username,
      joined: userInLockeeStats ? userInLockeeStats.joined : '-',
      timestampLastActive: Date.now() / 1000 - ckUser.timestampLastActive,
      verifiedTo: ckUser.isVerified() ? Utils.User.buildUserChatAt(ckUser.discordID, Utils.User.UserRefType.snowflake) : null,
      additional: { timeSinceLast: calculatedTimeSinceLastLock > 0 ? Date.now() / 1000 - calculatedTimeSinceLastLock : 0 },
      isVerified: ckUser.isVerified(),
      routerStats: routerStats
    }
  }
}
