import * as DecisionRoll from '@/commands/decision/roll'
import * as DecisionRollCustomize from '@/commands/decision/customize'
import * as DecisionRollList from '@/commands/decision/list.cmd'
import * as Middleware from '@/middleware'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: decisionRouterSub,
  middleware: [Middleware.isUserRegistered],
  name: 'decision',
  permissions: {
    defaultEnabled: false,
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('decision')
    .setDescription('Decision Rolls Utilize User Generated Outcomes')
    // * Directly interact with Decision Rolls
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roll')
        .setDescription('Roll User Generated Decision')
        .addStringOption((option) => option.setName('id').setDescription('Specify the ID or Nickname of the Decision Roller').setRequired(true))
    )
    // * Manage Decision Rolls
    .addSubcommand((subcommand) =>
      subcommand
        .setName('nickname')
        .setDescription('A Nicknamed Roller is Easier to Share With Other Users and is More Memorable')
        .addStringOption((option) => option.setName('id').setDescription('Specify the ID or Nickname of the Decision Roller').setRequired(true))
        .addStringOption((option) => option.setName('nickname').setDescription('A Nicknamed Roller is Easier to Share With Other Users and is More Memorable').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('Fetch a List of Decision Rolls Where You are the Creator or are Listed as a Manager.')
    ),
  type: 'interaction'
})

async function decisionRouterSub(routed: RoutedInteraction) {
  const subCommand = routed.interaction.options.getSubcommand() as 'roll' | 'manage' | 'list'
  const idOrNickname = routed.interaction.options.get('id')?.value
  // const interactionType = routed.interaction.options.get('type')?.value

  // Roll w/ID or Nickname is specified
  if (subCommand === 'roll' && idOrNickname) {
    return await DecisionRoll.runSavedDecision(routed)
  }

  // Customize Roller
  if (subCommand === 'manage' && idOrNickname) {
    return await DecisionRollCustomize.customUsername(routed)
  }

  // List Decisions
  if (subCommand === 'list') {
    return await DecisionRollList.list(routed)
  }

  // // Stats
  // if (subCommand === 'stats') {
  //   if (interactionType === 'lockee') return CKStats.getLockeeStats(routed)
  //   if (interactionType === 'lockees') return CKStats.getKeyholderLockees(routed)
  //   if (interactionType === 'keyholder') return CKStats.getKeyholderStats(routed)
  //   if (interactionType === 'multilocked') return CKStats.getCheckLockeeMultiLocked(routed)
  // }

  // // Update
  // if (subCommand === 'update') return CKUpdate.update(routed)

  // // Verify
  // if (subCommand === 'verify') return CKVerify.verify(routed)

  // Nothing has been specified
  await routed.reply('A Decision Menu Option Must be Selected.')
  return true
}
