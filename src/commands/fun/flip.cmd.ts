import { AcceptedResponse, Routed } from '@/router'
import { flipCoin } from '@/commands/fun/flip.embed'

/**
 * Flip a coin
 * @export
 * @param {Routed} routed
 */
export async function flip(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  return await routed.reply({ embeds: [flipCoin(Math.floor(Math.random() * Number(2)))] })
}
