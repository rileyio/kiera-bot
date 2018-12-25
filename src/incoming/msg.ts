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
  // Block my own messages
  if (msg.author.id === '526039977247899649') return; // Hard block

  // Ping Pong
  if (msg.content === 'ping') Commands.pingPong(bot, msg)
  // Prefix Check
  if (msg.content.startsWith(prefix)) prefixRouter(bot, msg)

  // No other fallback here - otherwise the bot will reply to everyone's messages
  return;
}

/**
 * Routing for prefixed commands
 * @param {Bot} bot
 * @param {Message} msg
 */
function prefixRouter(bot: Bot, msg: Message) {
  // Register Controller
  if (msg.content.startsWith(`${prefix}register`)) return Commands.registerUser(bot, msg, getArgs(msg.content))
  // Version Controller
  if (msg.content.startsWith(`${prefix}version`)) return Commands.versionCheck(bot, msg)
  // Devices Connected Count
  if (msg.content.startsWith(`${prefix}devices`)) return devicesRouter(bot, msg)
  // React -> to router
  if (msg.content.startsWith(`${prefix}react`)) return reactRouter(bot, msg)
  // Duration -> to router
  if (msg.content.startsWith(`${prefix}duration`)) return durationRouter(bot, msg)
  // Admin -> to router
  if (msg.content.startsWith(`${prefix}admin`)) return adminRouter(bot, msg)

  // Fallback
  msg.reply({
    embed: {
      color: 3447003,
      description: "Fallback - Coming soon"
    }
  });
}

/**
 * Final routing for `!devices` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function devicesRouter(bot: Bot, msg: Message) {
  // Verify user is registered first
  if (!await bot.Users.verify(msg.author.id)) {
    await msg.reply(`:exclamation: You'll need to register first with the \`!register\` command in order to proceed`)
    return;
  }

  const args = getArgs(msg.content)
  if (args[1] === 'connected') return Commands.devicesConnectedCount(bot, msg, args)
}

/**
 * Final routing for `!react` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function reactRouter(bot: Bot, msg: Message) {
  // Verify user is registered first
  if (!await bot.Users.verify(msg.author.id)) {
    await msg.reply(`:exclamation: You'll need to register first with the \`!register\` command in order to proceed`)
    return;
  }

  const args = getArgs(msg.content)
  if (args[2] === 'time') return Commands.setReactTime(bot, msg, args)
}

/**
 * Final routing for `!duration` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function durationRouter(bot: Bot, msg: Message) {
  // Verify user is registered first
  if (!await bot.Users.verify(msg.author.id)) {
    await msg.reply(`:exclamation: You'll need to register first with the \`!register\` command in order to proceed`)
    return;
  }

  const args = getArgs(msg.content)
  if (args[2] === 'time') return Commands.setDurationTime(bot, msg, args)
}

/**
 * Final routing for `!admin` commands
 * @param {Bot} bot
 * @param {Message} msg
 */
async function adminRouter(bot: Bot, msg: Message) {
  // Verify the user has the correct role
  // if (!await bot.Users.verify(msg.author.id)) {
  //   return;
  // }

  const args = getArgs(msg.content)
  if (args[1] === 'user') return Commands.adminRemoveUser(bot, msg, args)
}