import { EmbedBuilder } from 'discord.js'

export function flipCoin(outcome: number) {
  return new EmbedBuilder().setColor(14553782).setTitle(outcome === 0 ? '`Heads`' : '`Tails`')
}
