import { Bot } from '@/index'

export function stats(Bot: Bot, socket: SocketIO.Server) {
  // Emit stats periodically
  setInterval(() => {
    heartBeat(Bot, socket)
  }, 2000)
}

export function heartBeat(Bot: Bot, socket: SocketIO.Server) {
  socket.emit('heartbeat', {
    stats: {
      commands: Bot.BotMonitor.LiveStatistics.BotStatistics.commands,
      servers: Bot.BotMonitor.LiveStatistics.BotStatistics.servers,
      uptime: Bot.BotMonitor.LiveStatistics.BotStatistics.uptime,
      version: Bot.BotMonitor.LiveStatistics.BotStatistics.version
    }
  })
}
