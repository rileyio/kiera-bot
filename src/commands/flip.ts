import { ExportRoutes, RouterRouted } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'
import { flipCoin } from '@/embedded/flip-embed'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: flip,
  description: 'Help.Fun.Flip.Description',
  name: 'flip-coin',
  permissions: {
    serverOnly: false
  },
  slash: new SlashCommandBuilder().setName('flip').setDescription('Flip a coin'),
  type: 'interaction'
})

/**
 * Flip a coin
 * @export
 * @param {RouterRouted} routed
 */
export async function flip(routed: RouterRouted) {
  await routed.reply({ embeds: [flipCoin(Math.floor(Math.random() * Number(2)))] })
  return true
}
