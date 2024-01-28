import { rollDice, rollDie } from '#commands/fun/roll.embed'

import Random from 'random'
import { Routed } from '#router/index'

/**
 * Roll (a die | dice)
 * @export
 * @param {Routed} routed
 */
export async function roll(routed: Routed<'discord-chat-interaction'>) {
  const sides = (routed.interaction.options.get('sides')?.value as number) || 6
  const dice = (routed.interaction.options.get('dice')?.value as number) || 1

  if (dice !== 1) {
    const set = []
    for (let index = 0; index < dice; index++) {
      set.push(Random.int(1, sides))
    }

    return await routed.reply({ embeds: [rollDice(sides, dice, set)] })
  }

  const set: Array<number> = [Random.int(1, sides)]
  return await routed.reply({ embeds: [rollDie(Number(sides), set)] })
}
