import { AcceptedResponse } from '@/objects/router/routed-interaction'
import { RoutedInteraction } from '@/router'
import { flipCoin } from '@/commands/fun/flip.embed'

/**
 * Flip a coin
 * @export
 * @param {RoutedInteraction} routed
 */
export async function flip(routed: RoutedInteraction): AcceptedResponse  {
  return await routed.reply({ embeds: [flipCoin(Math.floor(Math.random() * Number(2)))] })
}
