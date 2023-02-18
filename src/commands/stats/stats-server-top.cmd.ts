// import * as Utils from '@/utils'

// import { ExportRoutes, RouterRouted } from '@/router'

// import { ServerStatisticType } from '@/objects/statistics'
// import { statsTopServerChannels } from '@/commands/stats/stats-server.embed'

// export const Routes = ExportRoutes({
//   category: 'Stats',
//   controller: statsByTopChannels,
//   description: 'Help.Stats.ViewTopChannelsByStats.Description',
//   example: '{{prefix}}stats top channels',
//   middleware: [],
//   name: 'stats-top-channels',
//   permissions: {
//     defaultEnabled: true,
//     restricted: false,
//     serverOnly: true
//   },
//   type: 'message',
//   validate: '/stats:string/top:string/channels:string'
// })

// export async function statsByTopChannels(routed: RouterRouted) {
//   const data = await routed.bot.DB.aggregate<{ channelID: string; count: number; name?: string }>('stats-servers', [
//     {
//       $match: { serverID: routed.message.guild.id, type: ServerStatisticType.Message }
//     },
//     {
//       $group: {
//         _id: '$channelID',
//         count: { $sum: 1 }
//       }
//     },
//     { $sort: { count: -1 } },
//     {
//       $project: {
//         _id: 0,
//         channelID: '$_id',
//         count: 1
//       }
//     }
//   ])

//   // Map channel names
//   const mappedData = data
//     .map((stat) => {
//       stat.name = Utils.Channel.buildChannelChatAt(stat.channelID)
//       return stat
//     })
//     // Limit to just the top 20
//     .slice(0, 20)

//   await routed.message.channel.send({
//     embeds: [
//       statsTopServerChannels({
//         data: mappedData,
//         serverIcon: routed.message.guild.iconURL()
//       })
//     ]
//   })

//   return true
// }
