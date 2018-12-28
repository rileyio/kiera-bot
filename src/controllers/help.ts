import * as Instructions from '../usage-instructions';
import { RouterRouted } from '../utils/router';

export async function genericFallback(routed: RouterRouted) {
  await routed.message.reply(Instructions.help);
}

export async function commandHelp(routed: RouterRouted) {
  await routed.message.reply(Instructions[routed.v.o.command])
}

// embed: {
//   color: 3447003,
//   author: {
//     name: bot.client.user.username,
//     icon_url: bot.client.user.avatarURL,
//     title: 'Commands Help',
//     description: 'Commands will always begin with the `!` prefix.',
//     fields: [
//       {
//         title: `\`!help\` - Displays this help menu`,
//       },
//       {
//         title: `\`!register\` - Displays this help menu`,
//         description: ``
//       }
//     ]
//   },
// }