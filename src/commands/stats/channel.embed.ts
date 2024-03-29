import * as Utils from '#utils'
import { EmbedBuilder } from 'discord.js'

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
  let descriptionBuilt = `\nStats are collected using the UTC timezone. Stats shown are from the last 30 days.\n\n`
  descriptionBuilt += `Channel Created: \`${new Date(stats.created).toLocaleDateString()}\` (\`${Utils.calculateHumanTimeDDHHMM(
    Date.now() / 1000 - stats.created / 1000
  )} ago\`)\n`
  descriptionBuilt += `Members: \`${stats.members}\`\n`
  descriptionBuilt += `NSFW: \`${stats.nsfw ? 'Yes' : 'No'}\`\n\n`
  descriptionBuilt += `**Top 10 Users by Messages sent**\n`

  stats.data.forEach((user) => {
    descriptionBuilt += `\`${user.messages}\` ${user.name}\n`
  })

  return new EmbedBuilder()
    .setColor(7413873)
    .setDescription(descriptionBuilt)
    .setFooter({
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: 'Observed by Kiera'
    })
    .setThumbnail(stats.serverIcon)
    .setTimestamp(new Date())
    .setTitle(`Channel Stats for \`${stats.name}\``)
}
