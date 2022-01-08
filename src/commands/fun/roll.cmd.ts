import * as Random from 'random'

import { rollDice, rollDie } from '@/commands/fun/roll.embed'

import { RoutedInteraction } from '@/router'

/**
 * Roll (a die | dice)
 * @export
 * @param {RoutedInteraction} routed
 */
export async function roll(routed: RoutedInteraction) {
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
