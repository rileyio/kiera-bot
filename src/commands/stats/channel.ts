import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'
import { ServerStatisticType, StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

import { ObjectId } from 'mongodb'
import { TextChannel } from 'discord.js'
import { statsChannel } from '@/embedded/stats-channel'

export const Routes = ExportRoutes({
  category: 'Stats',
  controller: statsForChannel,
  description: 'Help.Stats.ViewChannelStats.Description',
  example: '{{prefix}}stats channel',
  middleware: [],
  name: 'stats-channels',
  permissions: {
    defaultEnabled: true,
    restricted: false,
    serverOnly: true
  },
  type: 'message',
  validate: '/stats:string/channel:string/id?=string-number'
})

export async function statsForChannel(routed: RouterRouted) {
  const channelID = routed.v.o.id !== undefined ? `${routed.v.o.id}` : routed.message.channel.id

  // Check for stats disabled setting on channel
  if (await routed.bot.DB.verify('stats-settings', { channelID, setting: StatisticsSettingType.ChannelDisableStats })) {
    await routed.message.reply(routed.$render('Stats.Channel.DisabledInfo'))

    return true // Stop here
  }

  const data = await routed.bot.DB.aggregate<{ name?: string; userID: string; messages: number; reactions: number }>('stats-servers', [
    {
      $match: {
        _id: {
          $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000)
        },
        channelID,
        serverID: routed.message.guild.id,
        type: ServerStatisticType.Message
      }
    },
    {
      $group: {
        _id: '$userID',
        messages: { $sum: 1 }
      }
    },
    { $sort: { messages: -1 } },
    {
      $project: {
        _id: 0,
        messages: 1,
        userID: '$_id'
      }
    }
  ])

  // Map User @ names
  const mappedData = data
    .map((stat) => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })
    // Limit to just the top 10
    .slice(0, 10)

  // Fetch channel details
  const channelDetails = routed.bot.client.channels.cache.find((c) => c.id === channelID) as TextChannel

  await routed.message.channel.send({
    embeds: [
      statsChannel({
        created: channelDetails.createdTimestamp,
        data: mappedData,
        members: channelDetails.members.size,
        name: channelDetails.name,
        nsfw: channelDetails.nsfw,
        serverIcon: routed.message.guild.iconURL()
      })
    ]
  })

  return true
}
