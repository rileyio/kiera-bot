import * as Utils from '@/utils'

interface StatsUsersData {
  userID: string
  avatar: string
  username: string
  discriminator: string
  nickname: string
  created: number
  joinedTimestamp: number
  messages: number
  reactions: number
  channelsReached: number
  data: Array<{
    name?: string
    channelID: string
    messages: number
    reactions: number
  }>
}

export function statsUser(stats: StatsUsersData) {
  var descriptionBuilt = `\n`
  descriptionBuilt += `Messages on server: \`${stats.messages}\`\n`
  descriptionBuilt += `Reactions on server: \`${stats.reactions}\`\n`
  descriptionBuilt += `Total channels reached: \`${stats.channelsReached}\`\n`
  descriptionBuilt += `Joined Server: \`${new Date(stats.joinedTimestamp).toLocaleDateString()}\` (\`${Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - stats.joinedTimestamp / 1000)} ago\`)\n`
  descriptionBuilt += `User Created: \`${new Date(stats.created).toLocaleDateString()}\` (\`${Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - stats.created / 1000)} ago\`)\n\n`

  const channels = stats.data.splice(0, 5)
  descriptionBuilt += `**Top 5 Channels by Messages sent**\n`
  channels.forEach(channel => {
    descriptionBuilt += `\`${channel.messages}\` ${channel.name}\n`
  })

  // Resort for reactions
  const reactions = stats.data.sort((a, b) => b.reactions - a.reactions).splice(0, 5)
  descriptionBuilt += `\n**Top ${reactions.length} Channels by Reactions made**\n`
  reactions.forEach(channel => {
    descriptionBuilt += `\`${channel.reactions}\` ${channel.name}\n`
  })

  return {
    embed: {
      title: `User Stats for \`${stats.nickname || stats.username}#${stats.discriminator}\``,
      description: descriptionBuilt,
      color: 7413873,
      timestamp: new Date(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Observed by Kiera'
      },
      thumbnail: {
        url: `https://cdn.discordapp.com/avatars/${stats.userID}/${stats.avatar}`
      }
    }
  }
}
