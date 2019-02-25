import { Bot } from '../..';

export function stats(Bot: Bot, socket: SocketIO.Server) {
  // Emit stats periodically
  setInterval(() => {
    heartBeat(Bot, socket)
  }, 10000)
}

export function heartBeat(Bot: Bot, socket: SocketIO.Server) {
  socket.emit('heartbeat', { stats: Bot.BotMonitor.Stats.Bot })
}