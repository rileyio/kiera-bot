/* eslint-disable sort-keys */
import { RoutedInteraction } from '@/router'

/**
 * Maps CK Exp roles to roles on server
 * @export
 * @param {RouterRouted} routed
 */
export async function map(routed: RoutedInteraction) {
  const role = routed.interaction.options.getRole('role')
  const what = routed.interaction.options.get('what')?.value as number

  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple('server-settings', {
    key: /^server\.ck\.roles\.exp/,
    serverID: routed.guild.id
  })
  // Already Mapped as Object
  const alreadyMappedIDs = {
    // Lockee
    noviceLockeeX: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.1`),
    noviceLockeeY: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.11`),
    noviceLockeeZ: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.111`),
    intermediateLockeeX: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.2`),
    intermediateLockeeY: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.22`),
    intermediateLockeeZ: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.222`),
    experiencedLockeeX: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.3`),
    experiencedLockeeY: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.33`),
    experiencedLockeeZ: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.333`),
    devotedLockeeX: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.4`),
    devotedLockeeY: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.44`),
    devotedLockeeZ: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.444`),
    fanaticalLockeeX: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.5`),
    fanaticalLockeeY: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.55`),
    fanaticalLockeeZ: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.555`),
    // Keyholder
    noviceKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.101`),
    keyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.102`),
    establishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.103`),
    distinguishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.104`),
    renownedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.105`)
  }

  if (what >= 1 && what <= 555 && what && role.id) {
    const targetRole = role

    if (targetRole) {
      const upsertResult = await routed.bot.DB.update(
        'server-settings',
        { serverID: routed.guild.id, key: `server.ck.roles.exp.${what}` },
        { value: targetRole.id },
        { upsert: true }
      )

      if (upsertResult) return await routed.reply(`\`${what}\` is now pointed to <@&${targetRole.id}>`, true)
    } else {
      return await routed.reply(`Could not find that role id \`${role.id}\`, please check that you have the correct role id and try again!`, true)
    }
  }

  return await routed.reply(
    routed.$render('ChastiKey.Customize.MapExpRole', {
      noviceLockeeX: alreadyMappedIDs.noviceLockeeX ? `<@&${alreadyMappedIDs.noviceLockeeX.value}>` : ``,
      noviceLockeeY: alreadyMappedIDs.noviceLockeeY ? `<@&${alreadyMappedIDs.noviceLockeeY.value}>` : ``,
      noviceLockeeZ: alreadyMappedIDs.noviceLockeeZ ? `<@&${alreadyMappedIDs.noviceLockeeZ.value}>` : ``,
      intermediateLockeeX: alreadyMappedIDs.intermediateLockeeX ? `<@&${alreadyMappedIDs.intermediateLockeeX.value}>` : ``,
      intermediateLockeeY: alreadyMappedIDs.intermediateLockeeY ? `<@&${alreadyMappedIDs.intermediateLockeeY.value}>` : ``,
      intermediateLockeeZ: alreadyMappedIDs.intermediateLockeeZ ? `<@&${alreadyMappedIDs.intermediateLockeeZ.value}>` : ``,
      experiencedLockeeX: alreadyMappedIDs.experiencedLockeeX ? `<@&${alreadyMappedIDs.experiencedLockeeX.value}>` : ``,
      experiencedLockeeY: alreadyMappedIDs.experiencedLockeeY ? `<@&${alreadyMappedIDs.experiencedLockeeY.value}>` : ``,
      experiencedLockeeZ: alreadyMappedIDs.experiencedLockeeZ ? `<@&${alreadyMappedIDs.experiencedLockeeZ.value}>` : ``,
      devotedLockeeX: alreadyMappedIDs.devotedLockeeX ? `<@&${alreadyMappedIDs.devotedLockeeX.value}>` : ``,
      devotedLockeeY: alreadyMappedIDs.devotedLockeeY ? `<@&${alreadyMappedIDs.devotedLockeeY.value}>` : ``,
      devotedLockeeZ: alreadyMappedIDs.devotedLockeeZ ? `<@&${alreadyMappedIDs.devotedLockeeZ.value}>` : ``,
      fanaticalLockeeX: alreadyMappedIDs.fanaticalLockeeX ? `<@&${alreadyMappedIDs.fanaticalLockeeX.value}>` : ``,
      fanaticalLockeeY: alreadyMappedIDs.fanaticalLockeeY ? `<@&${alreadyMappedIDs.fanaticalLockeeY.value}>` : ``,
      fanaticalLockeeZ: alreadyMappedIDs.fanaticalLockeeZ ? `<@&${alreadyMappedIDs.fanaticalLockeeZ.value}>` : ``,
      noviceKeyholder: alreadyMappedIDs.noviceKeyholder ? `<@&${alreadyMappedIDs.noviceKeyholder.value}>` : ``,
      keyholder: alreadyMappedIDs.keyholder ? `<@&${alreadyMappedIDs.keyholder.value}>` : ``,
      establishedKeyholder: alreadyMappedIDs.establishedKeyholder ? `<@&${alreadyMappedIDs.establishedKeyholder.value}>` : ``,
      distinguishedKeyholder: alreadyMappedIDs.distinguishedKeyholder ? `<@&${alreadyMappedIDs.distinguishedKeyholder.value}>` : ``,
      renownedKeyholder: alreadyMappedIDs.renownedKeyholder ? `<@&${alreadyMappedIDs.renownedKeyholder.value}>` : ``
    }),
    true
  )
}
