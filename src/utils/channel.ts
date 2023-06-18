import * as Discord from 'discord.js'
import { Logger } from '#utils'

/**
 * Deletes all messages in a given channel
 * @export
 * @param {Discord.TextChannel} channel
 */
export async function cleanTextChat(channel: Discord.TextChannel, DEBUG: Logger.Debug) {
  let messages: Discord.Collection<string, Discord.Message>
  do {
    messages = await channel.messages.fetch({ limit: 100 })
    DEBUG.log(`bulk channel message cleanup, deleting batch of ${messages.size} messages`)
    await channel.bulkDelete(messages)
  } while (messages.size > 0)
}

/**
 * Deletes all messages in a given channel provided by message ID
 * @export
 * @param {Discord.TextChannel} channel
 * @param {Discord.Collection<string, Discord.Message>} messages
 * @param {Logging.Debug} DEBUG
 */
export async function deleteSpecificMessages(channel: Discord.TextChannel, messages: Discord.Collection<string, Discord.Message>, DEBUG: Logger.Debug) {
  do {
    DEBUG.log(`bulk channel message cleanup, deleting batch of ${messages.size} messages`)
    await channel.bulkDelete(messages)
  } while (messages.size > 0)
}

/**
 * Deletes a message from a textChannel
 * @export
 * @param {*} textChannel
 * @param {string} id
 */
export async function deleteMessage(textChannel: Discord.TextChannel | Discord.DMChannel, id: string, debug?: debug.IDebugger) {
  // Find message in channel
  const msg = await textChannel.messages.fetch(id)

  // Delete message
  await msg.delete()

  debug ? debug(`deleted message id:${id} channelId:${textChannel.id}`) : console.log(`deleted message id:${id} channelId:${textChannel.id}`)
}

export function buildChannelChatAt(input: string | Discord.TextChannel): string {
  return `<#${input}>`
}
