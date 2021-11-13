import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'
import { ServerStatisticType, StatisticsSettingType } from '@/objects/statistics'

import { ObjectId } from 'mongodb'
import { statsUser } from '@/embedded/stats-user'

export const Routes = ExportRoutes({
  category: 'Stats',
  controller: statsForUser,
  description: 'Help.Stats.ViewUserStats.Description',
  example: '{{prefix}}stats user',
  middleware: [],
  name: 'stats-user',
  permissions: {
    defaultEnabled: true,
    restricted: false,
    serverOnly: true
  },
  type: 'message',
  validate: '/stats:string/user:string/id?=string-number'
})

export async function statsForUser(routed: RouterRouted) {
  const userID = routed.v.o.id !== undefined ? `${routed.v.o.id}` : routed.author.id

  // Check for stats disabled setting from user
  if (
    await routed.bot.DB.verify('stats-settings', {
      setting: StatisticsSettingType.UserDisableStats,
      userID
    })
  ) {
    routed.v.o.id !== undefined
      ? await routed.message.reply(
          `This user has requested their stats be disabled - (Note: They may appear in channel or server statistics unless they've deleted all stored statistics.)`
        )
      : await routed.message.reply(
          `You've disabled your stats, while in this state no new stats will be collected and this command will be disabled (Note: you may appear in Server or Channel statistics unless you delete all your user statistics.)`
        )
    return true // Stop here
  }

  const member = await routed.message.guild.members.fetch(userID)
  const data = await routed.bot.DB.aggregate<{ name?: string; channelID: string; messages: number; reactions: number }>('stats-servers', [
    {
      $match: {
        _id: {
          $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000)
        },
        // eslint-disable-next-line sort-keys
        $or: [
          {
            type: ServerStatisticType.Message
          },
          {
            type: ServerStatisticType.Reaction
          }
        ],
        serverID: routed.message.guild.id,
        userID
      }
    },
    {
      $group: {
        _id: '$channelID',
        messages: {
          $sum: {
            // eslint-disable-next-line sort-keys
            $cond: { if: { $eq: ['$type', ServerStatisticType.Message] }, then: 1, else: 0 }
          }
        },
        reactions: {
          $sum: {
            // eslint-disable-next-line sort-keys
            $cond: { if: { $eq: ['$type', ServerStatisticType.Reaction] }, then: 1, else: 0 }
          }
        }
      }
    },
    { $sort: { messages: -1 } },
    {
      $project: {
        _id: 0,
        channelID: '$_id',
        messages: 1,
        reactions: 1
      }
    }
  ])

  // Count number of channels
  const numberOfChannels = data.length
  const numberOfMessages = data
    .map((c) => {
      return c.messages
    })
    .reduce((prev, cur) => (cur += prev))
  const numberOfReactions = data
    .map((c) => {
      return c.reactions
    })
    .reduce((prev, cur) => (cur += prev))

  // Map User @ names
  const mappedData = data.map((stat) => {
    stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
    return stat
  })

  await routed.message.channel.send({
    embeds: [
      statsUser({
        avatar: member.user.avatar,
        channelsReached: numberOfChannels,
        created: member.user.createdTimestamp,
        data: mappedData,
        discriminator: member.user.discriminator,
        joinedTimestamp: member.joinedTimestamp,
        messages: numberOfMessages,
        nickname: member.nickname,
        reactions: numberOfReactions,
        userID: member.id,
        username: member.user.username
      })
    ]
  })

  return true
}
