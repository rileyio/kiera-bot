import { Message, MessageEmbed, MessagePayload } from 'discord.js'

export function flipCoin(outcome: number): Partial<MessageEmbed> {
  return {
    title: outcome === 0 ? '`Heads`' : '`Tails`',
    color: 14553782
  }
}
