import { RouterRouted } from '@/router'

export function middlewareTest(routed: RouterRouted) {
  return new Promise<RouterRouted>((r) => {
    setTimeout(() => {
      routed.bot.Log.Command.log('middlewareTest!')
      r(routed)
    }, 1000)
  })
}
