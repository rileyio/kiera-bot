import * as Utils from '@/utils'

import { Routed } from '@/router'
import { ObjectId } from 'bson'
import { ServerStatisticType } from '@/objects/statistics'
import { statsServer } from '@/commands/stats/stats-server.embed'

export async function get(routed: Routed<'discord-chat-interaction'>) {
  const topChannelsByMsgCount = await routed.bot.DB.aggregate<{ channelID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { _id: { $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, serverID: routed.guild.id, type: ServerStatisticType.Message }
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
      $match: { _id: { $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, serverID: routed.guild.id, type: ServerStatisticType.Message }
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
        count: 1,
        userID: '$_id'
      }
    }
  ])

  const topUsersByReactionsCount = await routed.bot.DB.aggregate<{ userID: string; count: number; name?: string }>('stats-servers', [
    {
      $match: { _id: { $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }, serverID: routed.guild.id, type: ServerStatisticType.Reaction }
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
        count: 1,
        userID: '$_id'
      }
    }
  ])

  const usersJoinedAndLeft = await routed.bot.DB.aggregate<{ type: ServerStatisticType; count: number }>('stats-servers', [
    {
      $match: {
        $or: [
          {
            type: ServerStatisticType.UserJoined
          },
          {
            type: ServerStatisticType.UserLeft
          }
        ],
        _id: {
          $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000)
        },
        serverID: routed.guild.id
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
        count: 1,
        type: '$_id'
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
  const mappedUsersJoined = usersJoinedAndLeft.find((s) => s.type === ServerStatisticType.UserJoined) || { count: 0, type: ServerStatisticType.UserJoined }
  const mappedUsersLeft = usersJoinedAndLeft.find((s) => s.type === ServerStatisticType.UserLeft) || { count: 0, type: ServerStatisticType.UserLeft }

  return await routed.reply({
    embeds: [
      statsServer({
        data: {
          channels: mappedChannelData,
          reactions: mappedUserReactionsData,
          users: mappedUserData
        },
        memberCount: routed.guild.memberCount,
        serverAgeTimestamp: routed.guild.createdTimestamp,
        serverIcon: routed.guild.iconURL(),
        usersJoined: mappedUsersJoined.count,
        usersLeft: mappedUsersLeft.count
      })
    ]
  })
}
