import { Bot } from '../..';

export function stats(Bot: Bot, socket: SocketIO.Server) {
  // Emit stats periodically
  setInterval(() => {
    socket.emit('heartbeat', { stats: Bot.BotMonitor.Stats.Bot })
  }, 10000)
}