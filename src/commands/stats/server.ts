import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { statsTopServerChannels, statsServer } from '@/embedded/stats-server'
import { ServerStatisticType } from '@/objects/statistics'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: statsByTopChannels,
    example: '{{prefix}}stats top channels',
    name: 'stats-top-channels',
    validate: '/stats:string/top:string/channels:string',
    middleware: [],
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      restricted: false
    }
  },
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: serverStats,
    example: '{{prefix}}stats server',
    name: 'stats-server',
    validate: '/stats:string/server:string',
    middleware: [],
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      restricted: false
    }
  }
)

export async function statsByTopChannels(routed: RouterRouted) {
  const data = await routed.bot.DB.aggregate<{ channelID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { type: ServerStatisticType.Message, serverID: routed.message.guild.id }
    },
    {
      $group: {
        _id: '$channelID',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        channelID: '$_id',
        count: 1
      }
    }
  ])

  // Map channel names
  const mappedData = data
    .map(stat => {
      stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
      return stat
    })
    // Limit to just the top 20
    .slice(0, 20)

  await routed.message.channel.send(
    statsTopServerChannels({
      serverIcon: routed.message.guild.iconURL,
      data: mappedData
    })
  )

  return true
}

export async function serverStats(routed: RouterRouted) {
  const topChannelsByMsgCount = await routed.bot.DB.aggregate<{ channelID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { type: ServerStatisticType.Message, serverID: routed.message.guild.id }
    },
    {
      $group: {
        _id: '$channelID',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        channelID: '$_id',
        count: 1
      }
    }
  ])

  const topUsersByMsgCount = await routed.bot.DB.aggregate<{ userID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { type: ServerStatisticType.Message, serverID: routed.message.guild.id }
    },
    {
      $group: {
        _id: '$userID',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        userID: '$_id',
        count: 1
      }
    }
  ])

  const topUsersByReactionsCount = await routed.bot.DB.aggregate<{ userID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { type: ServerStatisticType.Reaction, serverID: routed.message.guild.id }
    },
    {
      $group: {
        _id: '$userID',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        userID: '$_id',
        count: 1
      }
    }
  ])

  // Map channel names
  const mappedChannelData = topChannelsByMsgCount
    // Limit to just the top 5
    .slice(0, 5)
    .map(stat => {
      stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
      return stat
    })

  // Map channel names
  const mappedUserData = topUsersByMsgCount
    // Limit to just the top 5
    .slice(0, 5)
    .map(stat => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })

  // Map channel names
  const mappedUserReactionsData = topUsersByReactionsCount
    // Limit to just the top 5
    .slice(0, 5)
    .map(stat => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })

  await routed.message.channel.send(
    statsServer({
      serverAgeTimestamp: routed.message.guild.createdTimestamp,
      serverIcon: routed.message.guild.iconURL,
      memberCount: routed.message.guild.memberCount,
      data: { channels: mappedChannelData, users: mappedUserData, reactions: mappedUserReactionsData }
    })
  )

  return true
}
