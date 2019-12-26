import * as Utils from '@/utils'
import { ServerStatisticType } from '@/objects/statistics'

interface StatsTopServerChannelsData {
  serverIcon: string
  data: Array<{
    channelID: string
    count: number
    name?: string
  }>
}

interface StatsServerData {
  serverAgeTimestamp: number
  serverIcon: string
  memberCount: number
  usersJoined: number
  usersLeft: number
  data: {
    channels: Array<{
      channelID: string
      count: number
      name?: string
    }>
    users: Array<{
      userID: string
      count: number
      name?: string
    }>
    reactions: Array<{
      userID: string
      count: number
      name?: string
    }>
  }
}

export function statsTopServerChannels(stats: StatsTopServerChannelsData) {
  var descriptionBuilt = `\n`

  stats.data.forEach(channel => {
    descriptionBuilt += `\`${channel.count}\` ${channel.name}\n`
  })

  return {
    embed: {
      title: `Top ${stats.data.length} Channels by Messages`,
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

export function statsServer(stats: StatsServerData) {
  var fields = [] as Array<{ name: string; value: string }>
  var descriptionBuilt = `Stats are collected using the UTC timezone. Stats shown are from the last 7 days.\n\n`
  // Add Server Age
  descriptionBuilt += `Server Created: \`${new Date(stats.serverAgeTimestamp).toLocaleDateString()}\` (\`${Utils.Date.calculateHumanTimeDDHHMM(
    Date.now() / 1000 - stats.serverAgeTimestamp / 1000
  )} ago\`)\n`
  // Add Server Member Count
  descriptionBuilt += `Current Member Count: \`${stats.memberCount}\`\n`
  // Add Server User Joined & Leave stats
  descriptionBuilt += `Members Join : Leave: \`${stats.usersJoined}\` : \`${stats.usersLeft}\`\n`
  if (stats.usersJoined !== 0 || stats.usersLeft !== 0)
    descriptionBuilt += `Server Size ${stats.usersJoined - stats.usersLeft > 0 ? 'Increased by' : 'Decreased by'}: \`${Math.round(
      Math.abs((Math.round(((stats.memberCount - (stats.memberCount - (stats.usersJoined - stats.usersLeft))) / (stats.memberCount - (stats.usersJoined - stats.usersLeft))) * 1000) / 1000) * 100) *
        100
    ) / 100}%\``

  // Add channels
  var channelsField = { name: `Top ${stats.data.channels.length} Channels by Messages`, value: '' }
  stats.data.channels.forEach((channel, i) => {
    channelsField.value += `\`${channel.count}\` ${channel.name}\n`
  })
  fields.push(channelsField)

  // Add users
  var usersField = { name: `Top ${stats.data.users.length} Members by Messages`, value: '' }
  stats.data.users.forEach((user, i) => {
    usersField.value += `\`${user.count}\` ${user.name}\n`
  })
  fields.push(usersField)

  // Add users by reactions
  if (stats.data.reactions.length > 0) {
    var reactionsField = { name: `Top ${stats.data.reactions.length} Members by Reactions`, value: '' }
    stats.data.reactions.forEach((user, i) => {
      reactionsField.value += `\`${user.count}\` ${user.name}\n`
    })
    fields.push(reactionsField)
  }

  return {
    embed: {
      title: `Server Statistics`,
      description: descriptionBuilt,
      color: 7413873,
      timestamp: new Date(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Observed by Kiera'
      },
      thumbnail: {
        url: stats.serverIcon
      },
      fields
    }
  }
}
