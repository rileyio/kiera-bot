import { MessageEmbed } from 'discord.js'

export function flipCoin(outcome: number): Partial<MessageEmbed> {
  return {
    color: 14553782,
    title: outcome === 0 ? '`Heads`' : '`Tails`'
  }
}
