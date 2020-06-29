import * as Middleware from '@/middleware'
import { performance } from 'perf_hooks'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedMessage } from '@/objects/message'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Info',
    controller: versionCheck,
    description: 'Help.Admin.BotVersion.Description',
    example: '{{prefix}}version',
    name: 'admin-version',
    validate: '/version:string',
    permissions: { serverOnly: false }
  },
  {
    type: 'message',
    category: 'Info',
    controller: pingPong,
    description: 'Help.Admin.BotPing.Description',
    example: '{{prefix}}ping',
    name: 'admin-ping',
    validate: '/ping:string',
    permissions: { serverOnly: false }
  },
  {
    type: 'message',
    category: 'Admin',
    controller: forceRestart,
    description: 'Help.Admin.BotRestart.Description',
    example: '{{prefix}}restart bot',
    name: 'root-restart-bot',
    permissions: {
      restricted: true,
      restrictedTo: [
        '473856245166506014', // KevinCross#0001
        '146439529824256000', // Emma#1366
        '448856044840550403' // Sanni#0001
      ]
    },
    validate: '/admin:string/restart:string/bot:string/seconds?=number',
    middleware: [Middleware.hasRole('developer')]
  }
)

export async function pingPong(routed: RouterRouted) {
  const startTime = performance.now()

  // Track all incoming messages
  await routed.bot.MsgTracker.trackMsg(
    new TrackedMessage({
      authorID: routed.message.author.id,
      id: routed.message.id,
      messageCreatedAt: routed.message.createdAt.getTime(),
      channelId: routed.message.channel.id,
      // Flags
      flagAutoDelete: true,
      flagTrack: true,
      // Deletion settings
      storageKeepInChatFor: 10000
    })
  )

  const ms = Math.round((performance.now() - startTime) * 100) / 100
  const response = await routed.message.reply(`pong \`${ms}ms\``)

  if (!Array.isArray(response)) {
    await routed.bot.MsgTracker.trackMsg(
      new TrackedMessage({
        authorID: response.author.id,
        id: response.id,
        messageCreatedAt: response.createdAt.getTime(),
        channelId: response.channel.id,
        // Flags
        flagAutoDelete: true,
        flagTrack: true,
        // Deletion settings
        storageKeepInChatFor: 10000
      })
    )
  }

  routed.bot.Log.Command.log(`${routed.message.content} response => pong ${ms}ms`)
  return true
}

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {RouterRouted} routed
 */
export async function versionCheck(routed: RouterRouted) {
  routed.message.channel.send(`Running on version \`${routed.bot.version}\``)
  return true
}

export async function forceRestart(routed: RouterRouted) {
  await routed.message.channel.send(
    routed.$render('Admin.BotManualRestart', {
      seconds: (routed.v.o.seconds || 5000) / 1000
    })
  )

  setTimeout(() => {
    process.exit(0)
  }, routed.v.o.seconds || 5000)

  // Successful end
  return true
}
