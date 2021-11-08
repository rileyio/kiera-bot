import * as Random from 'random'

import { ExportRoutes, RoutedInteraction } from '@/router'
import { rollDice, rollDie } from '@/embedded/roll-embed'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: roll,
  description: 'Help.Fun.Roll.Description',
  name: 'roll-die',
  permissions: {
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll 1 or more dice')
    .addIntegerOption((option) => option.setName('sides').setDescription('Number of sides for the dice'))
    .addIntegerOption((option) => option.setName('dice').setDescription('Number of dice to roll')),
  type: 'interaction'
})

/**
 * Roll (a die | dice)
 * @export
 * @param {RoutedInteraction} routed
 */
async function roll(routed: RoutedInteraction) {
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
