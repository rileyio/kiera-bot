import { Bot } from '@/index'

export async function fetchUserCounts(Bot: Bot) {
  var totalUsers = 0
  var totalRegistered = 0

  totalUsers = Bot.client.users.cache.size

  // Get total registered to the bot
  totalRegistered = await Bot.DB.count('users', {})

  return {
    total: totalUsers,
    registered: totalRegistered
  }
}

export async function fetchGuildStats(Bot: Bot) {
  return {
    total: Bot.client.guilds.cache.size
  }
}
