import { Bot } from '@/index'
import { TrackedBotSetting } from '@/objects/setting'

export async function fetchUserCounts(Bot: Bot) {
  var totalUsers = 0
  var totalUsersOnline = 0
  var totalRegistered = 0

  totalUsersOnline = Bot.client.users.cache.filter((m) => m.presence.status !== 'offline').size
  totalUsers = Bot.client.users.cache.size

  // Get total registered to the bot
  totalRegistered = await Bot.DB.count('users', {})

  return {
    total: totalUsers,
    online: totalUsersOnline,
    registered: totalRegistered
  }
}

export async function fetchGuildStats(Bot: Bot) {
  return {
    total: Bot.client.guilds.cache.size
  }
}
