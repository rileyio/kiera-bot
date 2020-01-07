import * as jwt from 'jsonwebtoken'
import * as errors from 'restify-errors'
import * as Validation from '@/api/validations'
import { WebRouted } from '@/api/web-router'
import { TrackedUser } from '@/objects/user'
import { validate } from '@/api/utils/validate'
import { UserData } from 'chastikey.js/app/objects'

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
    // Get user's current ChastiKey username from users collection or by the override
    var user = new TrackedUser(
      await routed.Bot.DB.get<TrackedUser>('users', { id: routed.session.userID })
    )

    // If user does not exist, fail
    if (!user) {
      return routed.next(new errors.BadRequestError())
    }

    // Find the user in ck-users first to help determine query for Kiera's DB (Find based off Username if requested)
    // var ckUser = new UserData(await routed.Bot.DB.get<UserData>('ck-users', { username: /Emma/i }))
    var ckUser = new UserData(
      await routed.Bot.DB.get<UserData>('ck-users', { discordID: user.id })
    )

    // If the lookup is upon someone else with no data, return the standard response
    if (!ckUser.userID) {
      return routed.next(new errors.BadRequestError())
    }

    const usernameRegex = new RegExp(`^${ckUser.username}$`, 'i')

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
    if (!ckUser.timestampFirstKeyheld) {
      return routed.next(new errors.BadRequestError())
    }

    return routed.res.send({
      keyholder: ckUser,
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
    const v = await validate(Validation.ChastiKey.lockeeFetch(), routed.req.body)
    const hasUsernameInReq = v.o.username ? true : false

    // Get user from lockee data (Stats, User and Locks)
    const lockeeData = await routed.Bot.Service.ChastiKey.fetchAPILockeeData({
      discordid: hasUsernameInReq ? undefined : routed.session.userID,
      username: hasUsernameInReq ? v.o.username : undefined,
      showDeleted: true
    })

    // If user does not exist, fail
    if (lockeeData.response.status !== 200) {
      return routed.next(new errors.BadRequestError())
    }

    // If the user has display_in_stats === 2 then stop here
    if (!lockeeData.data.displayInStats) {
      return routed.next(new errors.BadRequestError())
    }

    return routed.res.send({
      lockee: lockeeData.data,
      runningLocks: lockeeData.getLocked,
      allLocks: lockeeData.locks
    })
  }

  /**
   * Find Locks, Keyholders and Shared KH Locks matching the query
   * @export
   * @param {WebRouted} routed
   * @returns
   */
  export async function search(routed: WebRouted) {
    const v = await validate(Validation.ChastiKey.search(), routed.req.body)

    if (v.valid) {
      const users = await routed.Bot.DB.getMultiple('ck-users', { username: new RegExp(`${v.o.query}`, 'i') })
      return routed.res.send(
        users.map((u: any) => {
          return { type: 'User', name: u.username, isVerified: u.discordID ? true : false }
        }) || []
      )
    }

    // Fallback, fail
    return routed.next(new errors.BadRequestError())
  }

  /**
   * Find user profile requested
   * @export
   * @param {WebRouted} routed
   * @returns
   */
  export async function user(routed: WebRouted) {
    const v = await validate(Validation.ChastiKey.user(), routed.req.body)

    if (v.valid) {
      // Get the user from the ChastiKey user cache to keep from spamming Kevin's servers
      const user = await routed.Bot.DB.get<UserData>('ck-users', { username: new RegExp(`${v.o.username}`, 'i') })

      // If the user is verified
      const kieraUser = new TrackedUser(
        user.discordID ? await routed.Bot.DB.get<TrackedUser>('ck-users', { id: user.discordID }) : {}
      )

      // User's discord avatar (again, only if verified)
      const discordUser = user.discordID ? await routed.Bot.client.fetchUser(user.discordID) : null

      // If user does not exist, fail
      if (!user) {
        return routed.next({ success: false })
      }

      return routed.res.send({ success: true, user, discord: discordUser ? { id: discordUser.id, avatar: discordUser.avatar } : { id: null, avatar: null } })
    }

    // Fallback, fail
    return routed.next(new errors.BadRequestError())
  }
}
