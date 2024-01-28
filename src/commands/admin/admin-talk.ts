// import { ExportRoutes, RouterRouted } from '#router/index'

// import { TextChannel } from 'discord.js'

// export const Routes = ExportRoutes({
//   category: 'Info',
//   controller: talkAsKiera,
//   description: 'Help.Admin.BotStatistics.Description',
//   example: '{{prefix}}admin speak as',
//   name: 'admin-talk',
//   permissions: {
//     defaultEnabled: true,
//     restricted: true,
//     restrictedTo: [
//       '146439529824256000' // Emma#1366
//     ],
//     serverAdminOnly: false
//   },
//   type: 'message',
//   validate: '/admin:string/speak:string/as:string/channel=string/text=string'
// })

// export async function talkAsKiera(routed: RouterRouted) {
//   const channel = (await routed.message.guild.channels.fetch(routed.v.o.channel)) as TextChannel
//   await channel.send({ content: routed.v.o.text || 'no text was specified' })
//   return true
// }
