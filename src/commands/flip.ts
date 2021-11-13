import { ExportRoutes, RouterRouted } from '@/router'

import { flipCoin } from '@/embedded/flip-embed'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: flip,
  description: 'Help.Fun.Flip.Description',
  example: '{{prefix}}flip',
  name: 'flip-coin',
  permissions: {
    serverOnly: false
  },
  type: 'message',
  validate: '/flip:string'
})

/**
 * Flip a coin
 * @export
 * @param {RouterRouted} routed
 */
export async function flip(routed: RouterRouted) {
  await routed.message.reply({ embeds: [flipCoin(Math.floor(Math.random() * Number(2)))] })
  return true
}
