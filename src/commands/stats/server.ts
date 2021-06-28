import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { statsTopServerChannels, statsServer } from '@/embedded/stats-server'
import { ServerStatisticType, StatisticsSetting, StatisticsSettingType, ServerStatistic } from '@/objects/statistics'
import { ObjectID } from 'bson'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    controller: statsByTopChannels,
    description: 'Help.Stats.ViewTopChannelsByStats.Description',
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
    controller: serverStats,
    description: 'Help.Stats.ViewServerStats.Description',
    example: '{{prefix}}stats server',
    name: 'stats-server',
    validate: '/stats:string/server:string',
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
    controller: aboutStats,
    description: 'Help.Stats.AboutStats.Description',
    example: '{{prefix}}stats about',
    name: 'stats-about',
    validate: '/stats:string/about:string',
    middleware: [],
    permissions: {
      defaultEnabled: true,
      restricted: false,
      serverOnly: true
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
    .map((stat) => {
      stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
      return stat
    })
    // Limit to just the top 20
    .slice(0, 20)

  await routed.message.channel.send(
    statsTopServerChannels({
      serverIcon: routed.message.guild.iconURL(),
      data: mappedData
    })
  )

  return true
}

export async function serverStats(routed: RouterRouted) {
  const topChannelsByMsgCount = await routed.bot.DB.aggregate<{ channelID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { _id: { $gt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, type: ServerStatisticType.Message, serverID: routed.message.guild.id }
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
      $match: { _id: { $gt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, type: ServerStatisticType.Message, serverID: routed.message.guild.id }
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
      $match: { _id: { $gt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, type: ServerStatisticType.Reaction, serverID: routed.message.guild.id }
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

  const usersJoinedAndLeft = await routed.bot.DB.aggregate<{ type: ServerStatisticType; count: number }>('stats-servers', [
    {
      $match: {
        _id: { $gt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) },
        $or: [{ type: ServerStatisticType.UserJoined }, { type: ServerStatisticType.UserLeft }],
        serverID: routed.message.guild.id
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1
      }
    }
  ])

  // Map channel names
  const mappedChannelData = topChannelsByMsgCount
    // Limit to just the top 5
    .slice(0, 5)
    .map((stat) => {
      stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
      return stat
    })

  // Map channel names
  const mappedUserData = topUsersByMsgCount
    // Limit to just the top 5
    .slice(0, 5)
    .map((stat) => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })

  // Map channel names
  const mappedUserReactionsData = topUsersByReactionsCount
    // Limit to just the top 5
    .slice(0, 5)
    .map((stat) => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })

  // Map Users Joined
  const mappedUsersJoined = usersJoinedAndLeft.find((s) => s.type === ServerStatisticType.UserJoined) || { type: ServerStatisticType.UserJoined, count: 0 }
  const mappedUsersLeft = usersJoinedAndLeft.find((s) => s.type === ServerStatisticType.UserLeft) || { type: ServerStatisticType.UserLeft, count: 0 }

  await routed.message.channel.send(
    statsServer({
      serverAgeTimestamp: routed.message.guild.createdTimestamp,
      serverIcon: routed.message.guild.iconURL(),
      memberCount: routed.message.guild.memberCount,
      usersJoined: mappedUsersJoined.count,
      usersLeft: mappedUsersLeft.count,
      data: { channels: mappedChannelData, users: mappedUserData, reactions: mappedUserReactionsData }
    })
  )

  return true
}

export async function aboutStats(routed: RouterRouted) {
  // Get states
  const serverStatsEnabled = await routed.bot.DB.verify<StatisticsSetting>('stats-settings', {
    serverID: routed.message.guild.id,
    setting: StatisticsSettingType.ServerEnableStats
  })

  const statsDisabledUser = await routed.bot.DB.verify<StatisticsSetting>('stats-settings', { userID: routed.author.id, setting: StatisticsSettingType.UserDisableStats })

  // Get user total stats count
  const statsCount = await routed.bot.DB.count<ServerStatistic>('stats-servers', { userID: routed.author.id })

  await routed.message.reply(
    routed.$render('Stats.Info.About', {
      serverState: serverStatsEnabled ? 'Enabled' : 'Disabled',
      userState: statsDisabledUser ? 'Disabled' : 'Enabled',
      count: statsCount
    })
  )
  return true
}
