import { RoutedInteraction } from '@/router'

import { TrackedBotSetting } from '@/objects/setting'
import { UserData } from 'chastikey.js/app/objects'
import { searchResults } from '@/commands/chastikey/search.embed'

export async function byUsername(routed: RoutedInteraction) {
  const username = routed.interaction.options.get('username')?.value as string
  const usernameRegex = new RegExp(username, 'i')

  // Search for users, Exluding those who requested to hide their stats
  let ckUsers = await routed.bot.DB.aggregate<UserData>('ck-users', [
    {
      $match: { username: usernameRegex }
    },
    { $sort: { discordID: -1, username: 1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  ckUsers = ckUsers.map((ckUser) => {
    return new UserData(ckUser)
  })
  return await routed.reply({ embeds: [searchResults(ckUsers, routed.routerStats, cachedTimestamp)] })
}
