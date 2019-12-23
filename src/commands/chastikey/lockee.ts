// import got = require('got')
// import * as APIUrls from '@/api-urls'
// import * as Middleware from '@/middleware'
// import * as Utils from '@/utils'
// import { RouterRouted, ExportRoutes } from '@/router'
// import { TrackedChastiKeyUser, TrackedChastiKeyLock, TrackedChastiKeyLockee, TrackedChastiKeyUserAPIFetch } from '@/objects/chastikey'
// import { lockeeHistory, lockeeHistoryPersonal, lockeeHistoryForKeyholder } from '@/embedded/chastikey-history'
// import { TrackedUser } from '@/objects/user'
// import { TrackedBotSetting } from '@/objects/setting'

// export const Routes = ExportRoutes(
//   {
//     type: 'message',
//     category: 'ChastiKey',
//     commandTarget: 'none',
//     controller: history,
//     example: '{{prefix}}ck lockee history',
//     name: 'ck-lockee-history',
//     validate: '/ck:string/lockee:string/history:string/',
//     middleware: [Middleware.isCKVerified],
//     permissions: {
//       defaultEnabled: true,
//       serverOnly: false
//     }
//   },
//   {
//     type: 'message',
//     category: 'ChastiKey',
//     commandTarget: 'none',
//     controller: historyPersonal,
//     example: '{{prefix}}ck lockee history personal',
//     name: 'ck-lockee-history-personal',
//     validate: '/ck:string/lockee:string/history:string/personal:string/',
//     middleware: [Middleware.isCKVerified],
//     permissions: {
//       defaultEnabled: true,
//       serverOnly: false
//     }
//   }
//   // {
//   //   type: 'message',
//   //   category: 'ChastiKey',
//   //   commandTarget: 'none',
//   //   controller: historyForKeyholder,
//   //   example: '{{prefix}}ck lockee history Emma keyholder',
//   //   name: 'ck-lockee-history-keyholder',
//   //   validate: '/ck:string/lockee:string/history:string/user=string/keyholder:string/',
//   //   middleware: [
//   //     Middleware.isCKVerified
//   //   ],
//   //   permissions: {
//   //     restricted: true,
//   //     defaultEnabled: true,
//   //     serverOnly: false
//   //   }
//   // }
// )

// export async function history(routed: RouterRouted) {
//   // Get user from Cached CK Users collection
//   const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { discordID: routed.user.id }))

//   // If user has displayInStats set to false
//   if (!ckUser.displayInStats) {
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
//     return true // Stop here
//   }

//   // Get user's current ChastiKey username from users collection or by the override
//   const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

//   // Get current locks by user store in the collection
//   const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
//   // Get user from lockee data (Total locks, raitings, averages)
//   const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

//   // User has no data in the Lockee stats db
//   // Causes
//   //  - Have not opened the App in >=2 week
//   if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
//     // Notify in chat what the issue could be
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: ckUser.username }))
//     return true // Stop here
//   }

//   // Get all API locks
//   const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${ckUser.username}`, { json: true })
//   var apiLockeeLocks = apiResponse.body.locks

//   // Generate
//   var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks, routed.routerStats)

//   // Set cached timestamp for running locks
//   const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
//   const cachedTimestamp = cachedTimestampFromFetch.value

//   if (routed.message.channel.type === 'text') await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsHistorical))
//   await routed.message.author.send(lockeeHistory(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks, cachedTimestamp))
//   return true
// }

// export async function historyPersonal(routed: RouterRouted) {
//   // Get user from Cached CK Users collection
//   const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { discordID: routed.user.id }))

//   // If user has displayInStats set to false
//   if (!ckUser.displayInStats) {
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
//     return true // Stop here
//   }

//   // Get user's current ChastiKey username from users collection or by the override
//   const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

//   // Get current locks by user store in the collection
//   const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
//   // Get user from lockee data (Total locks, raitings, averages)
//   const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

//   // User has no data in the Lockee stats db
//   // Causes
//   //  - Have not opened the App in >=2 week
//   if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
//     // Notify in chat what the issue could be
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: ckUser.username }))
//     return true // Stop here
//   }

//   // Get all API locks
//   const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${ckUser.username}`, { json: true })
//   var apiLockeeLocks = apiResponse.body.locks

//   // Generate
//   var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks, routed.routerStats)

//   // Set cached timestamp for running locks
//   const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
//   const cachedTimestamp = cachedTimestampFromFetch.value

//   if (routed.message.channel.type === 'text') await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsHistorical))
//   await routed.message.author.send(lockeeHistoryPersonal(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks, cachedTimestamp))
//   return true
// }

// export async function historyForKeyholder(routed: RouterRouted) {
//   const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
//   // Get user from Cached CK Users collection
//   const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { username: usernameRegex }))

//   // If the lookup is upon someone else with no data, return the standard response
//   if (ckUser._noData === true && routed.v.o.user) {
//     // Notify in chat what the issue could be
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: routed.v.o.user }))
//     return true // Stop here
//   }

//   // If user has displayInStats set to false
//   if (!ckUser.displayInStats) {
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
//     return true // Stop here
//   }

//   // Get user's current ChastiKey username from users collection or by the override
//   const user = routed.v.o.user
//     ? new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: String(ckUser.discordID) }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] })) ||
//       // Fallback: Create a mock record
//       new TrackedUser(<TrackedUser>{ __notStored: true, ChastiKey: { username: ckUser.username, isVerified: false, ticker: { showStarRatingScore: true } } })
//     : // Else: Lookup the user by Discord ID
//       new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

//   // Get current locks by user store in the collection
//   const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
//   // Get user from lockee data (Total locks, raitings, averages)
//   const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

//   // User has no data in the Lockee stats db
//   // Causes
//   //  - Have not opened the App in >=2 week
//   if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
//     // Notify in chat what the issue could be
//     await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: ckUser.username }))
//     return true // Stop here
//   }

//   // Get all API locks
//   const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${ckUser.username}`, { json: true })
//   var apiLockeeLocks = apiResponse.body.locks

//   // Generate
//   var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks, routed.routerStats)

//   // Set cached timestamp for running locks
//   const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
//   const cachedTimestamp = cachedTimestampFromFetch.value

//   // if (routed.message.channel.type === 'text') await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsHistorical))
//   await routed.message.channel.send(
//     lockeeHistoryForKeyholder(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks, routed.routerStats, cachedTimestamp)
//   )
//   return true
// }
