import * as Discord from 'discord.js'
import { Message, Channel, TextChannel } from "discord.js";

/**
 * Deletes a message from a textChannel
 * @export
 * @param {*} textChannel
 * @param {string} messageId
 */
export async function deleteMessage(textChannel: any, messageId: string, debug: debug.IDebugger) {
  // Find message in channel
  const msg: Discord.Message = await textChannel.fetchMessage(messageId)
  // Race Condition check: Double check something was found (that it wasn't deleted by a user too quick)
  // Delete message
  await msg.delete()
  debug(`deleted message id:${messageId} channelId:${textChannel.id}`)
}

export async function deleteAllMessages(textChannel: any) {
  const messages = await textChannel.fetchMessages()
  await messages.deleteAll()
}

/**
 * Get channel from a collection
 * @export
 * @template T
 * @param {Discord.Collection<string, Discord.Channel>} channelCollection
 * @param {string} channelId
 * @returns
 */
export function getChannel(channelCollection: Discord.Collection<string, Discord.Channel>, channelId: string) {
  const channel = channelCollection.array().find(ch => ch.id === channelId)
  return channel
}

export function getArgs(msg: string) {
  return msg.replace(/^\!/, '').split(' ')
}