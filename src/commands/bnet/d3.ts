// import { RouterRouted, ExportRoutes } from '@/router'

// export const Routes = ExportRoutes(
//   {
//     type: 'message',
//     category: 'BNet',
//     controller: d3CurrentSeasonLookup,
//     description: 'Help.BattleNet.D3CurrentSeason.Description',
//     example: '{{prefix}}d3 season current',
//     name: 'bnet-d3-season-current',
//     validate: '/d3:string/season:string/current:string'
//   },
//   {
//     type: 'message',
//     category: 'BNet',
//     controller: d3ProfileLookup,
//     description: 'Help.BattleNet.D3ProfileLookup.Description',
//     example: '{{prefix}}d3 profile BattleTag#1234',
//     name: 'bnet-d3-profile',
//     validate: '/d3:string/profile:string/battletag=string'
//   }
// )

// /**
//  * Blizzard D3 Current Season Lookup
//  * @export
//  * @param {RouterRouted} routed
//  */
// export async function d3CurrentSeasonLookup(routed: RouterRouted) {
//   try {
//     const { data } = await routed.bot.Service.BattleNet.Client.d3.season()

//     routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Request successful!')

//     await routed.message.channel.send({
//       embed: {
//         title: 'Diablo 3',
//         color: data.service_season_state === 'active' ? 48658 : 9830418,
//         timestamp: new Date(data.last_update_time),
//         footer: {
//           text: 'Last Update Time'
//         },

//         fields: [
//           {
//             name: 'Current Season',
//             value: `${data.service_current_season}`,
//             inline: false
//           },
//           {
//             name: 'Current Season Status',
//             value: data.service_season_state === 'active' ? 'Live' : 'Not Live',
//             inline: false
//           }
//         ]
//       }
//     })
//   } catch (error) {
//     routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Error:', error.message)
//     if (error.response.data.status === 'nok') await routed.message.reply(routed.$render('BattleNet.Error.CharacterNotFound'))
//   }

//   return true
// }

// /**
//  * Blizzard D3 Profile Lookup
//  * @export
//  * @param {RouterRouted} routed
//  */
// export async function d3ProfileLookup(routed: RouterRouted) {
//   try {
//     const { data } = await routed.bot.Service.BattleNet.Client.d3.profile({ tag: routed.v.o.battletag.replace('#', '-') })
//     routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Request successful By BattleTag')

//     await routed.message.channel.send({
//       embed: {
//         title: 'Diablo 3 Profile',
//         description: `**${data.battleTag}**\nParagon Level: \`${data.paragonLevel}\` | HC: \`${data.paragonLevelHardcore}\` | Season: \`${data.paragonLevelSeason}\` | Season HC: \`${data.paragonLevelSeasonHardcore}\``,
//         color: 12457659,
//         timestamp: Date.now(),
//         footer: {
//           text: 'Fetched at'
//         },

//         fields: data.heroes.map((hero) => {
//           return {
//             name: `id: \`${hero.id}\``,
//             value: `Name: **${hero.name}**\n Level: \`${hero.level}\` | Paragon: ${hero.paragonLevel}\nClass: \`${hero.class}\``
//           }
//         })
//       }
//     })
//   } catch (error) {
//     routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Error:', error.message)
//     if (error.response.data.status === 'nok') await routed.message.reply(routed.$render('BattleNet.Error.CharacterNotFound'))
//   }

//   return true
// }
