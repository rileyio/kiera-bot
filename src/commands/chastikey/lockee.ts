import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes } from '@/router/routes-exporter'
import { RouterRouted } from '@/router'
import { TrackedUser } from '@/objects/user/'
import { lockeeHistory } from '@/embedded/chastikey-history'

export const Routes = ExportRoutes(
  {
    category: 'ChastiKey',
    controller: history,
    description: 'Help.ChastiKey.LockeeHistory.Description',
    example: '{{prefix}}ck lockee history',
    middleware: [Middleware.isCKVerified],
    name: 'ck-lockee-history',
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    },
    type: 'message',
    validate: '/ck:string/lockee:string/history:string/username?=string',
    validateAlias: ['/ck:string/lh:string/username?=string']
  },
  {
    category: 'ChastiKey',
    controller: toggleLockInNickname,
    example: '{{prefix}}ck lockee nickname status always',
    middleware: [Middleware.isCKVerified],
    name: 'ck-lockee-nickname-status',
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    },
    type: 'message',
    validate: '/ck:string/lockee:string/nickname:string/status:string/mode=string',
    validateAlias: ['/ck:string/nickname:string/mode=string']
  }
)

export async function history(routed: RouterRouted) {
  // Get any Kiera preferences
  const kieraUser = new TrackedUser(
    (await routed.bot.DB.get('users', routed.v.o.username ? { 'ChastiKey.username': routed.v.o.username } : { id: routed.author.id })) || { __notStored: true }
  )

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    discordid: !routed.v.o.username
      ? routed.author.id
      : kieraUser.__notStored
      ? undefined
      : kieraUser.ChastiKey.username.toLowerCase() === routed.v.o.username.toLowerCase()
      ? kieraUser.id
      : undefined,
    showDeleted: true,
    username: kieraUser.__notStored && routed.v.o.username ? routed.v.o.username : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    if (routed.v.o.username) {
      // Notify in chat what the issue could be for the target user
      await routed.message.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    } else {
      // Notify in chat what the issue could be for the user's own account
      await routed.message.reply(routed.$render('ChastiKey.Error.SelfLookupErrorOrNotFound'))
    }
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (lockeeData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
  }

  await routed.message.reply({
    embeds: [lockeeHistory(lockeeData, { showRating: !kieraUser.__notStored ? kieraUser.ChastiKey.ticker.showStarRatingScore : true }, routed.routerStats)]
  })
  return true
}

export async function toggleLockInNickname(routed: RouterRouted) {
  if (routed.v.o.mode === 'never' || routed.v.o.mode === 'always' || routed.v.o.mode === 'locked' || routed.v.o.mode === 'unlocked' || routed.v.o.mode === 'clear') {
    await routed.bot.DB.update(
      'users',
      { id: routed.author.id },
      { $set: { 'ChastiKey.preferences.lockee.showStatusInNickname': routed.v.o.mode === 'clear' ? 'never' : routed.v.o.mode } },
      { atomic: true }
    )

    // When Cleared, Clear the Nickname currently set of any padlocks
    if (routed.v.o.mode === 'clear') {
      const user = routed.message.guild.members.cache.get(routed.message.author.id)
      const currentNickname = user.nickname || user.user.username
      await user.setNickname(currentNickname.replace(/🔒|🔓/, ''))
      await routed.message.reply(routed.$render('ChastiKey.Nickname.ModeChangedAndCleared'))
    }

    if (routed.v.o.mode === 'never' || routed.v.o.mode === 'always' || routed.v.o.mode === 'locked' || routed.v.o.mode === 'unlocked')
      await routed.message.reply(routed.$render('ChastiKey.Nickname.ModeChanged', { mode: routed.v.o.mode }))
  }

  return true
}
