import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { ServerStatisticType, StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'
import { statsChannel } from '@/embedded/stats-channel'
import { TextChannel } from 'discord.js'
import { statsUser } from '@/embedded/stats-user'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Stats',
  commandTarget: 'none',
  controller: statsForUser,
  example: '{{prefix}}stats user',
  name: 'stats-user',
  validate: '/stats:string/user:string/id?=string-number',
  middleware: [],
  permissions: {
    defaultEnabled: true,
    serverOnly: true,
    restricted: false
  }
})

export async function statsForUser(routed: RouterRouted) {
  const userID = routed.v.o.id !== undefined ? `${routed.v.o.id}` : routed.user.id

  // Check for stats disabled setting from user
  if (await routed.bot.DB.verify<StatisticsSetting>('stats-settings', { userID, setting: StatisticsSettingType.UserDisableStats })) {
    routed.v.o.id !== undefined
      ? await routed.message.reply(`This user has requested their stats be disabled - (Note: They may appear in channel or server statistics unless they've deleted all stored statistics.)`)
      : await routed.message.reply(
          `You've disabled your stats, while in this state no new stats will be collected and this command will be disabled (Note: you may appear in Server or Channel statistics unless you delete all your user statistics.)`
        )
    return true // Stop here
  }

  const member = await routed.message.guild.fetchMember(userID)
  const data = await routed.bot.DB.aggregate<{ name?: string; channelID: string; messages: number; reactions: number }>('stats-servers', [
    {
      $match: { $or: [{ type: ServerStatisticType.Message }, { type: ServerStatisticType.Reaction }], serverID: routed.message.guild.id, userID }
    },
    {
      $group: {
        _id: '$channelID',
        messages: {
          $sum: {
            $cond: { if: { $eq: ['$type', ServerStatisticType.Message] }, then: 1, else: 0 }
          }
        },
        reactions: {
          $sum: {
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
    .map(c => {
      return c.messages
    })
    .reduce((prev, cur) => (cur += prev))
  const numberOfReactions = data
    .map(c => {
      return c.reactions
    })
    .reduce((prev, cur) => (cur += prev))

  // Map User @ names
  const mappedData = data.map(stat => {
    stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
    return stat
  })

  await routed.message.channel.send(
    statsUser({
      userID: member.id,
      avatar: member.user.avatar,
      username: member.user.username,
      discriminator: member.user.discriminator,
      nickname: member.nickname,
      created: member.user.createdTimestamp,
      joinedTimestamp: member.joinedTimestamp,
      messages: numberOfMessages,
      reactions: numberOfReactions,
      channelsReached: numberOfChannels,
      data: mappedData
    })
  )

  return true
}
