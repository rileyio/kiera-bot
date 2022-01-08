/* eslint-disable sort-keys */
import { RoutedInteraction } from '@/router'

/**
 * Maps CK Special roles to role on server
 * @export
 * @param {RouterRouted} routed
 */
export async function map(routed: RoutedInteraction) {
  const role = routed.interaction.options.getRole('role')
  const what = routed.interaction.options.get('what')?.value as number

  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple('server-settings', { serverID: routed.guild.id, key: /^server\.ck\.roles\.special/ })
  // Already Mapped as Object
  const alreadyMappedIDs = {
    unlocked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.1`),
    locked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.2`),
    locktober2019: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.3`),
    locktober2020: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.4`),
    locktober2021: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.5`)
  }

  if (((what >= 1 && what <= 55) || (what >= 101 && what <= 105)) && what && role.id) {
    const targetRole = role

    if (targetRole) {
      const upsertResult = await routed.bot.DB.update(
        'server-settings',
        { serverID: routed.guild.id, key: `server.ck.roles.special.${what}` },
        { value: targetRole.id },
        { upsert: true }
      )

      if (upsertResult) return await routed.reply(`\`${what}\` is now pointed to <@&${targetRole.id}>`, true)
    } else {
      return await routed.reply(`Could not find that role id \`${role.id}\`, please check that you have the correct role id and try again!`, true)
    }
  }

  return await routed.reply(
    routed.$render('ChastiKey.Customize.MapSpecialRole', {
      locked: alreadyMappedIDs.locked ? `<@&${alreadyMappedIDs.locked.value}>` : ``,
      locktober2019: alreadyMappedIDs.locktober2019 ? `<@&${alreadyMappedIDs.locktober2019.value}>` : ``,
      locktober2020: alreadyMappedIDs.locktober2020 ? `<@&${alreadyMappedIDs.locktober2020.value}>` : ``,
      locktober2021: alreadyMappedIDs.locktober2021 ? `<@&${alreadyMappedIDs.locktober2021.value}>` : ``,
      unlocked: alreadyMappedIDs.unlocked ? `<@&${alreadyMappedIDs.unlocked.value}>` : ``
    }),
    true
  )
}
