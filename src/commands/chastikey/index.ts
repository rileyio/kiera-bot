import * as CKUpdate from '@/commands/chastikey/update.cmd'
import * as CKVerify from '@/commands/chastikey/verify.cmd'
import * as Debug from '@/commands/chastikey/debug.cmd'
import * as Keyholder from '@/commands/chastikey/keyholder-stats.cmd'
import * as KeyholderLockees from '@/commands/chastikey/keyholder-lockees.cmd'
import * as Lockee from '@/commands/chastikey/lockee-stats.cmd'
import * as LockeeHistory from '@/commands/chastikey/lockee-history.cmd'
import * as Locktober from '@/commands/chastikey/locktober.cmd'
import * as Middleware from '@/middleware'
import * as Multilocked from '@/commands/chastikey/multilocked.cmd'
import * as Search from '@/commands/chastikey/search.cmd'
import * as Ticker from '@/commands/chastikey/ticker.cmd'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'ChastiKey',
  controller: ckStatsRouterSub,
  middleware: [Middleware.isCKVerified],
  name: 'ck',
  permissions: {
    defaultEnabled: false,
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('ck')
    .setDescription('ChastiKey Commands')
    .setDefaultPermission(true)

    // * /ck debug
    .addSubcommand((subcommand) =>
      subcommand
        .setName('debug')
        .setDescription('Debugging for ChastiKey Stats')
        .addStringOption((option) => option.setName('username').setDescription('Specify a Username to Debug').setRequired(true))
    )
    // * /ck history
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription('View Lockee History Breakdown')
        .addStringOption((option) => option.setName('username').setDescription('View by Username'))
    )
    // * /ck locktober
    .addSubcommand((subcommand) => subcommand.setName('locktober').setDescription('View Locktober Stats'))
    // * /ck search
    .addSubcommand((subcommand) =>
      subcommand
        .setName('search')
        .setDescription('Search Based off ChastiKey Username')
        .addStringOption((option) => option.setName('username').setDescription('Search by Username').setRequired(true))
    )
    // * /ck stats ...
    .addSubcommand((subcommand) =>
      subcommand
        .setName('stats')
        .setDescription('View ChastiKey Lockee Stats')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Type of ChastiKey Stats to return')
            .setRequired(true)
            .addChoice('Lockee', 'lockee')
            .addChoice('Lockees', 'lockees')
            .addChoice('Keyholder', 'keyholder')
            .addChoice('Multilocked', 'multilocked')
        )
        .addStringOption((option) => option.setName('username').setDescription('Specify a Username to Lookup a Different User'))
    )
    // * /ck ticker
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ticker')
        .setDescription('View ChastiKey Ticker')
        .addStringOption((option) => option.setName('username').setDescription('Specify a Username to Lookup a Different User'))
        .addStringOption((option) => option.setName('date').setDescription('Specify a Start Date for Ticker Data (YYYY-MM-DD)'))
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Type of ChastiKey Ticker(s) to Return')
            .addChoice('Lockee', 'lockee')
            .addChoice('Keyholder', 'keyholder')
            .addChoice('Show Both', 'both')
        )
    )
    // * /ck update
    .addSubcommand((subcommand) =>
      subcommand
        .setName('update')
        .setDescription('Sync your ChastiKey profile with Discord	')
        .addMentionableOption((option) => option.setName('user').setDescription('@ The user you wish to perform the update upon'))
    ),
  type: 'interaction'
})

function ckStatsRouterSub(routed: RoutedInteraction) {
  const subCommand = routed.interaction.options.getSubcommand()
  const interactionType = routed.interaction.options.get('type')?.value

  // Debug
  if (subCommand === 'debug') {
    return Debug.user(routed)
  }

  // Locktober
  if (subCommand === 'history') {
    return LockeeHistory.history(routed)
  }

  // Locktober
  if (subCommand === 'locktober') {
    return Locktober.stats(routed)
  }

  // Search
  if (subCommand === 'search') {
    return Search.byUsername(routed)
  }

  // Stats
  if (subCommand === 'stats') {
    if (interactionType === 'lockee') return Lockee.getStats(routed)
    if (interactionType === 'lockees') return KeyholderLockees.getStats(routed)
    if (interactionType === 'keyholder') return Keyholder.getStats(routed)
    if (interactionType === 'multilocked') return Multilocked.getStats(routed)
  }

  // Ticker
  if (subCommand === 'ticker') {
    return Ticker.getTicker(routed)
  }

  // Update
  if (subCommand === 'update') return CKUpdate.update(routed)

  // Verify
  if (subCommand === 'verify') return CKVerify.verify(routed)
}
