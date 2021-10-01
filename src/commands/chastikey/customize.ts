import * as Middleware from '@/middleware'
import { TrackedServerSetting } from '@/objects/server-setting'
import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    controller: mapExpRole,
    description: 'Help.ChastiKey.CustomizeExpRole.Description',
    example: '{{prefix}}ck map exp role 1 627557066382245888',
    name: 'ck-map-exp-roles',
    validate: '/ck:string/map:string/exp:string/role:string/index?=number/roleid?=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      serverOnly: true,
      serverAdminOnly: true
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: mapSpecialRoles,
    description: 'Help.ChastiKey.CustomizeSpecialRole.Description',
    example: '{{prefix}}ck map special role 1 627557066382245888',
    name: 'ck-map-special-roles',
    validate: '/ck:string/map:string/special:string/role:string/index?=number/roleid?=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      serverOnly: true,
      serverAdminOnly: true
    }
  }
)

/**
 * Maps CK Exp roles to roles on server
 * @export
 * @param {RouterRouted} routed
 */
export async function mapExpRole(routed: RouterRouted) {
  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple<TrackedServerSetting>('server-settings', { serverID: routed.message.guild.id, key: /^server\.ck\.roles\.exp/ })
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

  if (routed.v.o.index >= 1 && routed.v.o.index <= 555 && routed.v.o.index && routed.v.o.roleid) {
    const isTagged = /^\<|@\&([0-9]*)\>&/.test(routed.v.o.roleid)
    const targetRole = isTagged ? routed.message.mentions.roles.first() : await routed.message.guild.roles.fetch(String(routed.v.o.roleid))

    if (targetRole) {
      const upsertResult = await routed.bot.DB.update<TrackedServerSetting>(
        'server-settings',
        { serverID: routed.message.guild.id, key: `server.ck.roles.exp.${routed.v.o.index}` },
        { value: targetRole.id },
        { upsert: true }
      )

      if (upsertResult) await routed.message.reply(`\`${routed.v.o.index}\` is now pointed to <@&${targetRole.id}>`)
      return true
    } else {
      await routed.message.reply(`Could not find that role id \`${routed.v.o.roleid}\`, please check that you have the correct role id and try again!`)
      return true
    }
  }

  await routed.message.reply(
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
    })
  )

  return true
}

/**
 * Maps CK Special roles to role on server
 * @export
 * @param {RouterRouted} routed
 */
export async function mapSpecialRoles(routed: RouterRouted) {
  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple<TrackedServerSetting>('server-settings', { serverID: routed.message.guild.id, key: /^server\.ck\.roles\.special/ })
  // Already Mapped as Object
  const alreadyMappedIDs = {
    unlocked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.1`),
    locked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.2`),
    locktober2019: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.3`),
    locktober2020: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.4`),
    locktober2021: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.5`)
  }

  if (((routed.v.o.index >= 1 && routed.v.o.index <= 55) || (routed.v.o.index >= 101 && routed.v.o.index <= 105)) && routed.v.o.index && routed.v.o.roleid) {
    const isTagged = /^\<|@\&([0-9]*)\>&/.test(routed.v.o.roleid)
    const targetRole = isTagged ? routed.message.mentions.roles.first() : await routed.message.guild.roles.fetch(String(routed.v.o.roleid))

    if (targetRole) {
      const upsertResult = await routed.bot.DB.update<TrackedServerSetting>(
        'server-settings',
        { serverID: routed.message.guild.id, key: `server.ck.roles.special.${routed.v.o.index}` },
        { value: targetRole.id },
        { upsert: true }
      )

      if (upsertResult) await routed.message.reply(`\`${routed.v.o.index}\` is now pointed to <@&${targetRole.id}>`)
      return true
    } else {
      await routed.message.reply(`Could not find that role id \`${routed.v.o.roleid}\`, please check that you have the correct role id and try again!`)
      return true
    }
  }

  await routed.message.reply(
    routed.$render('ChastiKey.Customize.MapSpecialRole', {
      unlocked: alreadyMappedIDs.unlocked ? `<@&${alreadyMappedIDs.unlocked.value}>` : ``,
      locked: alreadyMappedIDs.locked ? `<@&${alreadyMappedIDs.locked.value}>` : ``,
      locktober2019: alreadyMappedIDs.locktober2019 ? `<@&${alreadyMappedIDs.locktober2019.value}>` : ``,
      locktober2020: alreadyMappedIDs.locktober2020 ? `<@&${alreadyMappedIDs.locktober2020.value}>` : ``,
      locktober2021: alreadyMappedIDs.locktober2021 ? `<@&${alreadyMappedIDs.locktober2021.value}>` : ``
    })
  )

  return true
}
