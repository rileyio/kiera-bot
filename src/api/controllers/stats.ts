import { WebRouted } from '@/api/web-router'

export namespace Stats {
  export async function getAll(routed: WebRouted) {
    return routed.res.send(routed.Bot.BotMonitor.LiveStatistics.Bot)
  }
}
