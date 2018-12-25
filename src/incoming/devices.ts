import { performance } from "perf_hooks";
import { Bot } from "..";
import { Message, Channel } from "discord.js";
import { TrackedMessage } from "../objects/message";

export async function devicesConnectedCount(bot: Bot, msg: Message, args: Array<string>) {
  await msg.reply(`Devices Connected: \`${bot.Lovense.devicesConnected.length}\``)
}