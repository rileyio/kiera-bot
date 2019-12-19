import * as Discord from 'discord.js'
import { Logging } from '@/utils'

export namespace Channel {
  /**
   * Deletes all mess ages in a given channel
   * @export
   * @param {Discord.TextChannel} channel
   */
  export async function cleanTextChat(channel: Discord.TextChannel, DEBUG: Logging.Debug) {
    var messages: Discord.Collection<string, Discord.Message>
    do {
      messages = await channel.fetchMessages({ limit: 100 })
      DEBUG.log(`bulk channel message cleanup, deleting batch of ${messages.size} messages`)
      await channel.bulkDelete(messages)
    } while (messages.size > 0)
  }

  /**
   * Get channel from a collection
   * @export
   * @template T
   * @param {Discord.Collection<string, Discord.Channel>} channelCollection
   * @param {string} channelId
   * @returns
   */
  export function getTextChannel(channelCollection: Discord.Collection<string, Discord.Channel>, channelId: string) {
    const channel = channelCollection.array().find(ch => ch.id === channelId)
    return <Discord.TextChannel>channel
  }

  /**
   * Deletes a message from a textChannel
   * @export
   * @param {*} textChannel
   * @param {string} id
   */
  export async function deleteMessage(textChannel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel, id: string, debug?: debug.IDebugger) {
    // Find message in channel
    const msg = await textChannel.fetchMessage(id)

    // Delete message
    await msg.delete()

    debug ? debug(`deleted message id:${id} channelId:${textChannel.id}`) : console.log(`deleted message id:${id} channelId:${textChannel.id}`)
  }

  export function buildChannelChatAt(input: string | Discord.TextChannel): string {
    return `<#${input}>`
  }
}
