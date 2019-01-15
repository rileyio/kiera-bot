import { RouterRouted } from '../utils/router';
import { sb, en } from '../string-builder';

export namespace Help {
  export async function genericFallback(routed: RouterRouted) {
    await routed.message.reply(sb(en.help.main, { prefix: process.env.BOT_MESSAGE_PREFIX }));
  }

  export async function commandHelp(routed: RouterRouted) {
    await routed.message.reply(sb(en.help[routed.v.o.command], { prefix: process.env.BOT_MESSAGE_PREFIX }))
  }
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