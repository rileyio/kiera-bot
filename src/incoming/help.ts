import { performance } from "perf_hooks";
import { Bot } from "..";
import { Message, Channel } from "discord.js";
import { TrackedMessage } from "../objects/message";
import { validateArgs, verifyUserRefType, buildUserChatAt } from "../utils";
import * as Instructions from '../usage-instructions';

export async function genericFallback(bot: Bot, msg: Message) {
  await msg.reply(Instructions.help);
}

export async function commandHelp(bot: Bot, msg: Message, command: string) {
  await msg.reply(Instructions[command])
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