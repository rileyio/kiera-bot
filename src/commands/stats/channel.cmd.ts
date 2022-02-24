import * as Utils from '@/utils'

import { ServerStatisticType, StatisticsSettingType } from '@/objects/statistics'

import { ObjectId } from 'mongodb'
import { RoutedInteraction } from '@/router'
import { TextChannel } from 'discord.js'
import { statsChannel } from '@/commands/stats/channel.embed'

export async function get(routed: RoutedInteraction) {
  const channelID = routed.interaction.options.getChannel('target')?.id || routed.interaction.channel.id

  // Check for stats disabled setting on channel
  if (await routed.bot.DB.verify('stats-settings', { channelID, setting: StatisticsSettingType.ChannelDisableStats }))
    return await routed.reply(routed.$render('Stats.Channel.DisabledInfo'))

  const data = await routed.bot.DB.aggregate<{ name?: string; userID: string; messages: number; reactions: number }>('stats-servers', [
    {
      $match: {
        _id: {
          $gt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000)
        },
        channelID,
        serverID: routed.guild.id,
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

  return await routed.reply({
    embeds: [
      statsChannel({
        created: channelDetails.createdTimestamp,
        data: mappedData,
        members: channelDetails.members.size,
        name: channelDetails.name,
        nsfw: channelDetails.nsfw,
        serverIcon: routed.guild.iconURL()
      })
    ]
  })
}
