import { performance } from 'perf_hooks';
import { TrackedMessage } from '../objects/message';
import { RouterRouted } from '../utils/router';

export async function pingPong(routed: RouterRouted) {
  const startTime = performance.now()

  // Track all incoming messages
  routed.bot.MsgTracker.trackMsg(new TrackedMessage({
    author_id: routed.message.author.id,
    author_username: routed.message.author.username,
    message_id: routed.message.id,
    message_createdAt: routed.message.createdAt.getTime(),
    channel_id: routed.message.channel.id,
    // Flags
    flag_auto_delete: true,
    flag_track: true
  }))

  const ms = Math.round((performance.now() - startTime) * 100) / 100
  const response = await routed.message.reply(`pong \`${ms}ms\``);

  if (!Array.isArray(response)) {
    routed.bot.MsgTracker.trackMsg(new TrackedMessage({
      author_id: response.author.id,
      author_username: response.author.username,
      message_id: response.id,
      message_createdAt: response.createdAt.getTime(),
      channel_id: response.channel.id,
      // Flags
      flag_auto_delete: true,
      flag_track: true
    }))
  }

  routed.bot.DEBUG_MSG_INCOMING(`${routed.message.content} response => pong ${ms}ms`)
}

export async function versionCheck(routed: RouterRouted) {
  await routed.message.reply(routed.bot.version, { code: true })
}

export * from './admin'
export * from './chastikey'
export * from './devices'
export * from './duration'
export * from './help'
export * from './limit'
export * from './react'
export * from './session'
export * from './user'