import { performance } from "perf_hooks";
import { Bot } from "..";
import { Message, Channel } from "discord.js";
import { TrackedMessage } from "../message";
import { validateArgs } from "../utils";

export async function setDurationTime(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'user', type: 'user' },
    { name: 'action', type: 'string' },
    { name: 'time', type: 'number' },
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!duration ${v.o.user} time ${v.o.time} -> validation check 'failed'`)
    await msg.channel.send(`Command error, must be formatted like: \`!duration @user#0000 time 10\``)
    return;
  }

  // Process command
  await msg.channel.send(`Setting duration to: \`${args[3]}\` minutes`)
  bot.DEBUG_MSG_COMMAND(`!duration ${v.o.user} time ${v.o.time}`)
}