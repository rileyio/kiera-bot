// import { ExportRoutes, RouterRouted } from '#router/index'
// import { EmbedBuilder } from 'discord.js'

// export const Routes = ExportRoutes({
//   category: 'Info',
//   controller: getBotStats,
//   description: 'Help.Admin.BotStatistics.Description',
//   example: '{{prefix}}admin stats',
//   name: 'admin-stats',
//   permissions: {
//     defaultEnabled: false,
//     serverAdminOnly: true
//   },
//   type: 'message',
//   validate: '/admin:string/stats:string'
// })

// export async function getBotStats(routed: RouterRouted) {
//   const stats = routed.bot.BotMonitor.LiveStatistics.BotStatistics
//   let sec = Math.floor(stats.uptime / 1000)
//   let min = Math.floor(sec / 60)
//   sec = sec % 60
//   let hrs = Math.floor(min / 60)
//   min = min % 60
//   const days = Math.floor(hrs / 24)
//   hrs = hrs % 24

//   const timeToShowDays = `${days > 9 ? +days : '0' + days} days`
//   const timeToShowHours = `${hrs > 9 ? +hrs : '0' + hrs}`
//   const timeToShowMins = `${min > 9 ? +min : '0' + min}`
//   const timeToShowSecs = `${sec > 9 ? +sec : '0' + sec}`

//   const combined = `${timeToShowDays} ${timeToShowHours}:${timeToShowMins}:${timeToShowSecs}`

//   return await routed.reply({
//     embeds: [
//       new EmbedBuilder()
//         .setColor(5472175)
//         .setFields(
//           {
//             inline: false,
//             name: 'Uptime',
//             value: `\`${combined}\``
//           },
//           {
//             inline: false,
//             name: '------------',
//             value: 'Messages'
//           },
//           {
//             inline: true,
//             name: '~ Stat ~',
//             value: 'seen\nsent\ntracked'
//           },
//           {
//             inline: true,
//             name: '#',
//             value: `\`${stats.messages.seen}\`\n\`${stats.messages.sent}\`\n\`${stats.messages.tracked}\``
//           },
//           {
//             inline: false,
//             name: '------------',
//             value: 'Commands'
//           },
//           {
//             inline: true,
//             name: '~ Stat ~',
//             value: 'routed\ncompleted\ninvalid'
//           },
//           {
//             inline: true,
//             name: '#',
//             value: `\`${stats.commands.routed}\`\n\`${stats.commands.completed}\`\n\`${stats.commands.invalid}\``
//           }
//         )
//         .setFooter({
//           text: 'Generated'
//         })
//         .setTimestamp(Date.now())
//         .setTitle('Bot Statistics')
//     ]
//   })
// }
