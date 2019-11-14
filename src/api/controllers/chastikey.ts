import * as jwt from 'jsonwebtoken'
import * as errors from 'restify-errors'
import { WebRouted } from '../web-router'
import { TrackedChastiKeyUser, TrackedChastiKeyKeyholderStatistics, TrackedChastiKeyLockee, TrackedChastiKeyLock } from '../../objects/chastikey'
import { TrackedUser } from '../../objects/user'

export namespace ChastiKey {
  export async function authTest(routed: WebRouted) {
    const sessionKey = routed.req.header('session')

    // If missing, fail
    if (!sessionKey) {
      console.log('validCKAuth => session key missing')
      routed.res.send(401, 'Unauthorized')
      return // FAIL
    }

    // Verify sessionKey
    try {
      // Verify sessionKey & payload
      const verifiedSession = jwt.verify(sessionKey, process.env.BOT_SECRET)
      console.log('validCKAuth => verifiedSession:', verifiedSession)
    } catch (error) {
      console.log('validCKAuth => Session not valid!')
      return routed.res.send(401, 'Unauthorized')
    }

    // Lookup ChastiKey user in DB by username and session
    const authKeyStored = await routed.Bot.DB.get<TrackedUser>('users', {
      'ChastiKey.extSession': sessionKey
    })

    // If no record, success
    if (authKeyStored) return routed.res.send({ success: true, username: authKeyStored.ChastiKey.username })

    // Fallback - fail auth
    console.log('validCKAuth => Session not found!')
    return routed.res.send(401, 'Unauthorized')
  }

  /**
   * Get KH compiled data for external view
   * @export
   * @param {WebRouted} routed
   * @returns
   */
  export async function khData(routed: WebRouted) {
    const session = routed.req.header('session')

    // Get user's current ChastiKey username from users collection or by the override
    var user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

    // If user does not exist, fail
    if (!user) {
      return routed.next(new errors.BadRequestError())
    }

    // Find the user in ck-users first to help determine query for Kiera's DB (Find based off Username if requested)
    var ckUser = new TrackedChastiKeyUser(await routed.Bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: user.id }))

    // If the lookup is upon someone else with no data, return the standard response
    if (ckUser._noData === true) {
      return routed.next(new errors.BadRequestError())
    }

    // If the user has display_in_stats === 2 then stop here
    if (!ckUser.displayInStats) {
      return routed.next(new errors.BadRequestError())
    }

    const usernameRegex = new RegExp(`^${ckUser.username}$`, 'i')

    // Get KH from KH data
    var keyholder = await routed.Bot.DB.get<TrackedChastiKeyKeyholderStatistics>('ck-keyholders', { username: usernameRegex })

    // Get lockees under a KH
    const cachedRunningLocks = await routed.Bot.DB.aggregate<{ _id: string; locks: Array<any>; count: number; uniqueCount: number }>('ck-running-locks', [
      {
        $match: { lockedBy: usernameRegex }
      },
      {
        $group: {
          _id: '$sharedLockName',
          locksArrayByLockedTime: { $addToSet: '$secondsLocked' },
          running: {
            $push: '$$ROOT'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          running: 1,
          uniqueCount: { $cond: { if: { $isArray: '$locksArrayByLockedTime' }, then: { $size: '$locksArrayByLockedTime' }, else: 0 } },
          avgLockedTime: { $avg: '$locksArrayByLockedTime' },
          count: 1
        }
      },
      { $sort: { name: 1 } }
    ])

    // If there is no data in the kh dataset inform the user
    if (!keyholder) {
      return routed.next(new errors.BadRequestError())
    }

    return routed.res.send({
      locks: cachedRunningLocks
    })
  }

  /**
   * Get Lockee compiled data for external view
   * @export
   * @param {WebRouted} routed
   * @returns
   */
  export async function lockeeData(routed: WebRouted) {
    const session = routed.req.header('session')

    // Get user's current ChastiKey username from users collection or by the override
    var user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

    // If user does not exist, fail
    if (!user) {
      return routed.next(new errors.BadRequestError())
    }

    // Find the user in ck-users first to help determine query for Kiera's DB (Find based off Username if requested)
    var ckUser = new TrackedChastiKeyUser(await routed.Bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: user.id }))

    // If the lookup is upon someone else with no data, return the standard response
    if (ckUser._noData === true) {
      return routed.next(new errors.BadRequestError())
    }

    // If the user has display_in_stats === 2 then stop here
    if (!ckUser.displayInStats) {
      return routed.next(new errors.BadRequestError())
    }

    // Get Lockee data
    const ckLockee = await routed.Bot.DB.get<TrackedChastiKeyLockee>(
      'ck-lockees',
      { discordID: ckUser.discordID },
      {
        _id: 0,
        username: 1,
        joined: 1,
        timestampLastActive: 1,
        secondsLockedInCurrentLock: 1,
        averageTimeLockedInSeconds: 1,
        longestCompletedLockInSeconds: 1,
        totalNoOfCompletedLocks: 1,
        averageRating: 1,
        noOfRatings: 1,
        discordID: 1
      }
    )
    const ckRunningLocks = await routed.Bot.DB.getMultiple<TrackedChastiKeyLock>(
      'ck-running-locks',
      { discordID: ckUser.discordID },
      {
        _id: 0,
        sharedLockID: 1,
        username: 1,
        discordID: 1,
        regularity: 1,
        multipleGreensRequired: 1,
        timestampLocked: 1,
        secondsLocked: 1,
        fixed: 1,
        cumulative: 1,
        cardInfoHidden: 1,
        timerHidden: 1,
        noOfTurns: 1,
        lockFrozenByCard: 1,
        lockFrozenByKeyholder: 1,
        discardPile: 1,
        lockedBy: 1,
        displayInStats: 1,
        sharedLockName: 1,
        doubleUpCards: 1,
        freezeCards: 1,
        greenCards: 1,
        redCards: 1,
        resetCards: 1,
        yellowCards: 1
      }
    )

    return routed.res.send({
      user: ckUser,
      lockee: ckLockee,
      locks: ckRunningLocks
    })
  }
}
