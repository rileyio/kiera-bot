import * as SocketIO from 'socket.io'

import { Bot } from '#/index'

export function stats(Bot: Bot, socket: SocketIO.Server) {
  // Emit stats periodically
  setInterval(() => {
    heartBeat(Bot, socket)
  }, 2000)
}

export function heartBeat(Bot: Bot, socket: SocketIO.Server) {
  socket.emit('heartbeat', {
    stats: {
      commands: {
        processed: Bot.BotMonitor.LiveStatistics.BotStatistics.commands,
        since: 'n/a'
      },
      servers: {
        change: 'n/a',
        count: Bot.BotMonitor.LiveStatistics.BotStatistics.servers
      },
      uptime: Bot.BotMonitor.LiveStatistics.BotStatistics.uptime,
      users: {
        count: 'n/a'
      },
      version: Bot.version
    }
  })
}
