import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { ServerStatisticType } from '@/objects/statistics'
import { statsChannel } from '@/embedded/stats-channel'
import { TextChannel } from 'discord.js'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Stats',
  commandTarget: 'none',
  controller: statsForChannel,
  example: '{{prefix}}stats channel',
  name: 'stats-channels',
  validate: '/stats:string/channel:string/id?=string-number',
  middleware: [],
  permissions: {
    defaultEnabled: true,
    serverOnly: true,
    restricted: false
  }
})

export async function statsForChannel(routed: RouterRouted) {
  const channelID = routed.v.o.id !== undefined ? `${routed.v.o.id}` : routed.message.channel.id
  const data = await routed.bot.DB.aggregate<{ name?: string; userID: string; messages: number; reactions: number }>('stats-servers', [
    {
      $match: { type: ServerStatisticType.Message, serverID: routed.message.guild.id, channelID }
    },
    {
      $group: {
        _id: '$userID',
        messages: { $sum: 1 },
        reactions: { $sum: 1 }
      }
    },
    { $sort: { messages: -1 } },
    {
      $project: {
        _id: 0,
        userID: '$_id',
        messages: 1,
        reactions: 1
      }
    }
  ])

  // Map User @ names
  const mappedData = data
    .map(stat => {
      stat.name = Utils.User.buildUserChatAt(stat.userID, Utils.User.UserRefType.snowflake)
      return stat
    })
    // Limit to just the top 10
    .slice(0, 10)

  // Fetch channel details
  const channelDetails = routed.bot.client.channels.find(c => c.id === channelID) as TextChannel

  await routed.message.channel.send(
    statsChannel({
      serverIcon: routed.message.guild.iconURL,
      name: channelDetails.name,
      created: channelDetails.createdTimestamp,
      members: channelDetails.members.size,
      nsfw: channelDetails.nsfw,
      data: mappedData
    })
  )

  return true
}
