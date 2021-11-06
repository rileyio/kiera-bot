import * as CKStats from '@/commands/chastikey/stats'
import * as CKUpdate from '@/commands/chastikey/update'
import * as CKVerify from '@/commands/chastikey/verify'
import * as Middleware from '@/middleware'

import { ExportRoutes, RouterRouted } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'ChastiKey',
  controller: ckStatsRouterSub,
  middleware: [Middleware.isCKVerified],
  name: 'ck-get-stats-lockee',
  permissions: {
    defaultEnabled: false,
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('ck')
    .setDescription('View ChastiKey Stats')
    .setDefaultPermission(false)
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
        .addStringOption((option) => option.setName('username').setDescription('Specify a username to lookup a different user'))
    ) // * /ck update
    .addSubcommand((subcommand) =>
      subcommand
        .setName('update')
        .setDescription('Sync your ChastiKey profile with Discord	')
        .addMentionableOption((option) => option.setName('user').setDescription('@ The user you wish to perform the update upon'))
    ) // * /ck verify
    .addSubcommand((subcommand) => subcommand.setName('verify').setDescription('Sync your ChastiKey profile with Discord')),
  type: 'interaction'
})

function ckStatsRouterSub(routed: RouterRouted) {
  const subCommand = routed.interaction.options.getSubcommand()
  const interactionType = routed.interaction.options.get('type')?.value

  // Stats
  if (subCommand === 'stats') {
    if (interactionType === 'lockee') return CKStats.getLockeeStats(routed)
    if (interactionType === 'lockees') return CKStats.getKeyholderLockees(routed)
    if (interactionType === 'keyholder') return CKStats.getKeyholderStats(routed)
    if (interactionType === 'multilocked') return CKStats.getCheckLockeeMultiLocked(routed)
  }

  // Update
  if (subCommand === 'update') return CKUpdate.update(routed)

  // Verify
  if (subCommand === 'verify') return CKVerify.verify(routed)
}
