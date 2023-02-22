// import * as Utils from '@/utils'

// import { ExportRoutes, Routed } from '@/router'
// import { TextChannel } from 'discord.js'

// export const Routes = ExportRoutes({
//   category: 'Admin',
//   controller: purgeChannelMessages,
//   description: 'Help.Admin.ChannelPurge.Description',
//   example: '{{prefix}}admin channel purge',
//   name: 'admin-channel-purge',
//   permissions: {
//     defaultEnabled: false,
//     serverAdminOnly: true
//   },
//   type: 'message',
//   validate: '/admin:string/channel:string/purge:string'
// })

// /**
//  * Purge Current Channel's Messages
//  * @export
//  * @param {Routed} routed
//  */
// export async function purgeChannelMessages(routed: Routed<'discord-chat-interaction'>) {
//   return Utils.Channel.cleanTextChat(<TextChannel>routed.channel, routed.bot.Log.Scheduled)
// }
