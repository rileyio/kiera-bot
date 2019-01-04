import { performance } from "perf_hooks";
import { RouterRouted } from "../../utils/router";
import { TrackedMessage } from "../../objects/message";

export async function pingPong(routed: RouterRouted) {
  const startTime = performance.now()

  // Track all incoming messages
  routed.bot.MsgTracker.trackMsg(new TrackedMessage({
    authorId: routed.message.author.id,
    authorUsername: routed.message.author.username,
    id: routed.message.id,
    messageCreatedAt: routed.message.createdAt.getTime(),
    channelId: routed.message.channel.id,
    // Flags
    flagAutoDelete: true,
    flagTrack: true,
    // Deletion settings
    storageKeepInChatFor: 10000
  }))

  const ms = Math.round((performance.now() - startTime) * 100) / 100
  const response = await routed.message.reply(`pong \`${ms}ms\``);

  if (!Array.isArray(response)) {
    routed.bot.MsgTracker.trackMsg(new TrackedMessage({
      authorId: response.author.id,
      authorUsername: response.author.username,
      id: response.id,
      messageCreatedAt: response.createdAt.getTime(),
      channelId: response.channel.id,
      // Flags
      flagAutoDelete: true,
      flagTrack: true,
      // Deletion settings
      storageKeepInChatFor: 10000
    }))
  }

  routed.bot.DEBUG_MSG_INCOMING.log(`${routed.message.content} response => pong ${ms}ms`)
}

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {RouterRouted} routed
 */
export async function versionCheck(routed: RouterRouted) {
  await routed.message.channel.send(`Running on version \`${routed.bot.version}\``)
}
