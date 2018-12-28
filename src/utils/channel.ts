import * as Debug from 'debug';
import * as Discord from 'discord.js';

export namespace Channel {
  /**  
   * Deletes all mess ages in a given channel
   * @export
   * @param {Discord.TextChannel} channel
   */
  export async function cleanTextChat(channel: Discord.TextChannel, DEBUG: Debug.IDebugger) {
    var messages: Discord.Collection<string, Discord.Message>;
    do {
      messages = await channel.fetchMessages({ limit: 50 })
      DEBUG(`bulk channel message cleanup, deleting batch of ${messages.size} messages`)
      await channel.bulkDelete(messages)
    } while (messages.size >= 2);
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
    return (<Discord.TextChannel>channel)
  }

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
}