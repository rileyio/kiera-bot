import { Bot } from '..'
import { TrackedBotSetting } from '../objects/setting'

export async function fetchUserCounts(Bot: Bot) {
  const skipGuildsInDB = await Bot.DB.get<TrackedBotSetting>('settings', { key: 'bot.statistics.ignoreGuilds' })
  var totalUsers = 0
  var totalUsersOnline = 0
  var totalRegistered = 0

  // Get totals from Discord
  Bot.client.guilds.forEach(guild => {
    // Block guilds   'from bot.statistics.ignoreGuilds'
    if ((<Array<string>>skipGuildsInDB.value).includes(guild.id)) return // Skip this guild
    totalUsers += guild.memberCount
    totalUsersOnline += guild.members.filter(m => m.presence.status !== 'offline').array().length
  })

  // Get total registered to the bot
  totalRegistered = await Bot.DB.count('users', {})

  return {
    total: totalUsers,
    online: totalUsersOnline,
    registered: totalRegistered
  }
}
