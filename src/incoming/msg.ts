import * as Debug from "debug";
import { Message } from 'discord.js';
import { Bot } from "..";

// Controllers
import * as Commands from './commands';
import { getArgs } from "../utils";

const prefix = process.env.BOT_MESSAGE_PREFIX

/**
 * Router for all incoming messages
 * @export
 * @param {Bot} bot
 * @param {Message} msg
 */
export function incoming(bot: Bot, msg: Message) {
  // Ping Pong
  if (msg.content === 'ping') Commands.pingPong(bot, msg)
  // Prefix Check
  if (msg.content.startsWith(prefix)) prefixRouter(bot, msg)
}

/**
 * Routing for prefixed commands
 * @param {Bot} bot
 * @param {Message} msg
 */
function prefixRouter(bot: Bot, msg: Message) {
  // Version Controller
  if (msg.content.startsWith(`${prefix}version`)) return Commands.versionCheck(bot, msg)
  // Devices Connected Count
  if (msg.content.startsWith(`${prefix}devices`)) return devicesRouter(bot, msg)
  // React -> to router
  if (msg.content.startsWith(`${prefix}react`)) return reactRouter(bot, msg)
  // Duration -> to router
  if (msg.content.startsWith(`${prefix}duration`)) return durationRouter(bot, msg)
}

/**
 * Final routing for `!devices` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function devicesRouter(bot: Bot, msg: Message) {
  const args = getArgs(msg.content)
  if (args[1] === 'connected') return Commands.devicesConnectedCount(bot, msg, args)
}

/**
 * Final routing for `!react` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function reactRouter(bot: Bot, msg: Message) {
  const args = getArgs(msg.content)
  if (args[2] === 'time') return Commands.setReactTime(bot, msg, args)
}

/**
 * Final routing for `!duration` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function durationRouter(bot: Bot, msg: Message) {
  const args = getArgs(msg.content)
  if (args[2] === 'time') return Commands.setDurationTime(bot, msg, args)
}