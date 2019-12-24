import * as Utils from '@/utils'

interface StatsChannelsData {
  serverIcon: string
  name: string
  created: number
  members: number
  nsfw: boolean
  data: Array<{
    name?: string
    userID: string
    messages: number
    reactions: number
  }>
}

export function statsChannel(stats: StatsChannelsData) {
  var descriptionBuilt = `\n`
  descriptionBuilt += `Channel Created: \`${new Date(stats.created).toLocaleDateString()}\` (\`${Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - stats.created / 1000)} ago\`)\n`
  descriptionBuilt += `Members: \`${stats.members}\`\n`
  descriptionBuilt += `NSFW: \`${stats.nsfw ? 'Yes' : 'No'}\`\n\n`
  descriptionBuilt += `**Top 10 Users by Messages sent**\n`

  stats.data.forEach(user => {
    descriptionBuilt += `\`${user.messages}\` ${user.name}\n`
  })

  return {
    embed: {
      title: `Channel Stats for \`${stats.name}\``,
      description: descriptionBuilt,
      color: 7413873,
      timestamp: new Date(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Observed by Kiera'
      },
      thumbnail: {
        url: stats.serverIcon
      }
    }
  }
}
