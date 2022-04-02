import { ExportRoutes, RouterRouted } from '@/router'

import { TrackedBotSetting } from '@/objects/setting'
import { pongResponse } from '@/embedded/ping-pong'

export const Routes = ExportRoutes(
  {
    category: 'Info',
    controller: pingPong,
    description: 'Help.Admin.BotPing.Description',
    example: '{{prefix}}ping',
    name: 'admin-ping',
    permissions: {
      serverOnly: false
    },
    type: 'message',
    validate: '/ping:string'
  },
  {
    category: 'Admin',
    controller: forceRestart,
    description: 'Help.Admin.BotRestart.Description',
    example: '{{prefix}}admin restart bot',
    name: 'root-restart-bot',
    permissions: {
      restricted: true,
      restrictedTo: [
        '146439529824256000' // Emma#1366
      ]
    },
    type: 'message',
    validate: '/admin:string/restart:string/bot:string/seconds?=number'
  },
  {
    category: 'Admin',
    controller: setStatus,
    description: 'Help.Admin.SetStatus.Description',
    example: '{{prefix}}admin bot status message "Message Here"',
    name: 'root-status-bot',
    permissions: {
      restricted: true,
      restrictedTo: [
        '146439529824256000' // Emma#1366
      ]
    },
    type: 'message',
    validate: '/admin:string/bot:string/status:string/message:string/text=string'
  }
)

export async function pingPong(routed: RouterRouted) {
  return await routed.reply({
    embeds: [pongResponse(routed.bot.BotMonitor.DBMonitor.pingTotalLatency / routed.bot.BotMonitor.DBMonitor.pingCount, routed.routerStats.performance)]
  })
}

export async function forceRestart(routed: RouterRouted) {
  await routed.reply(
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

export async function setStatus(routed: RouterRouted) {
  // Store status in db in the event of a restart
  await routed.bot.DB.update(
    'settings',
    { key: 'bot.status.message' },
    new TrackedBotSetting({ added: Date.now(), author: routed.message.author.id, env: '*', key: 'bot.status.message', updated: Date.now(), value: routed.v.o.text }),
    { upsert: true }
  )

  // Set the status
  return routed.bot.client.user.setPresence({ activities: [{ name: routed.v.o.text || '' }], status: 'online' })
}
