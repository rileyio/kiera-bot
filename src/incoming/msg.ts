import * as Debug from "debug";
import { Message } from 'discord.js';
import { performance } from "perf_hooks";
import { Bot } from "..";

// Controllers
import * as Commands from './commands';
import { getArgs } from "../utils";

const prefix = process.env.BOT_MESSAGE_PREFIX


export function incoming(bot: Bot, msg: Message) {

  // Ping Pong
  if (msg.content === 'ping') Commands.pingPong(bot, msg)
  // Prefix Check
  if (msg.content.startsWith(prefix)) prefixRouter(bot, msg)
}

export function prefixRouter(bot: Bot, msg: Message) {
  // Version Controller
  if (msg.content.startsWith(prefix + 'version')) return Commands.versionCheck(bot, msg)
  // Devices Connected Count
  if (msg.content.startsWith(prefix + 'devices')) return devicesRouter(bot, msg)
}

export async function devicesRouter(bot: Bot, msg: Message) {
  const args = getArgs(msg.content)
  
  if (args[1] === 'connected') return Commands.devicesConnectedCount(bot, msg, args)
}