import { RouterRouted, ExportRoutes } from '@/router'
import { flipCoin } from '@/embedded/flip-embed'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Fun',
  controller: flip,
  description: 'Help.Fun.Flip.Description',
  example: '{{prefix}}flip',
  name: 'flip-coin',
  validate: '/flip:string',
  permissions: { serverOnly: false }
})

/**
 * Flip a coin
 * @export
 * @param {RouterRouted} routed
 */
export async function flip(routed: RouterRouted) {
  await routed.message.reply(flipCoin(Math.floor(Math.random() * Number(2))))
  return true
}
