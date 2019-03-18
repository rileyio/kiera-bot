import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import { performance } from 'perf_hooks';
import { RouterRouted } from '../../router/router';
import { TrackedMessage } from '../../objects/message';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Info',
    commandTarget: 'none',
    controller: versionCheck,
    example: '{{prefix}}version',
    name: 'admin-version',
    validate: '/version:string',
  },
  {
    type: 'message',
    category: 'Info',
    commandTarget: 'none',
    controller: pingPong,
    example: '{{prefix}}ping',
    name: 'admin-ping',
    validate: '/ping:string'
  },
  {
    type: 'message',
    category: 'Admin',
    commandTarget: 'none',
    controller: forceRestart,
    example: '{{prefix}}restart bot',
    name: 'admin-restart-bot',
    permissions: {
      restricted: true
    },
    validate: '/admin:string/restart:string/bot:string/seconds?=number',
    middleware: [
      Middleware.hasRole('developer')
    ]
  })

export async function pingPong(routed: RouterRouted) {
  const startTime = performance.now()

  // Track all incoming messages
  await routed.bot.MsgTracker.trackMsg(new TrackedMessage({
    authorID: routed.message.author.id,
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
    await routed.bot.MsgTracker.trackMsg(new TrackedMessage({
      authorID: response.author.id,
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
  return true
}

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {RouterRouted} routed
 */
export async function versionCheck(routed: RouterRouted) {
  await routed.message.channel.send(`Running on version \`${routed.bot.version}\``)
  return true
}

export async function forceRestart(routed: RouterRouted) {
  await routed.message.channel.send(Utils.sb(Utils.en.admin.botManualRestart, {
    seconds: ((routed.v.o.seconds || 5000) / 1000)
  }))

  setTimeout(() => {
    process.exit(0)
  }, routed.v.o.seconds || 5000)

  // Successful end
  return true
}