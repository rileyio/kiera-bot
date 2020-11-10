import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import * as Discord from 'discord.js'
import { TrackedUser } from '@/objects/user'
import { RouterRouted, ExportRoutes } from '@/router'
import { performance } from 'perf_hooks'
import { TrackedAvailableObject } from '@/objects/available-objects'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: update,
  description: 'Help.ChastiKey.Update.Description',
  example: '{{prefix}}ck update',
  name: 'ck-update',
  validate: '/ck:string/update:string/user?=string',
  middleware: [Middleware.isCKVerified],
  permissions: {
    defaultEnabled: true,
    serverOnly: true
  }
})

/**
 * ChastiKey Update (For: Roles)
 * @export
 * @param {RouterRouted} routed
 */
export async function update(routed: RouterRouted) {
  const updatePerformance = {
    full: { start: performance.now(), end: 0 },
    verify: { start: 0, end: 0 },
    lockee: { start: 0, end: 0 },
    locktober: { start: 0, end: 0 },
    keyholder: { start: 0, end: 0 },
    nickname: { start: 0, end: 0 }
  }

  // Check if user calling this command is targeting a different user
  if (routed.v.o.user !== undefined) {
    // Restrict Update upon other users to Keyholder or above
    const khRole = routed.message.guild.roles.cache.find((r) => r.name.toLowerCase() === 'keyholder')
    // User calling this command must be higher than the khRole to call update upon another user than themself
    if (routed.message.member.roles.highest.position < khRole.position) {
      await routed.message.reply(routed.$render('ChastiKey.Error.KeyholderOrAboveRoleRequired'))
      return false // Stop the user here
    }
  }

  // The user being targeted is Type
  const targetUserType: 'Self' | 'Snowflake' | 'CKUsername' = routed.v.o.user === undefined ? 'Self' : routed.message.mentions.members.first() ? 'Snowflake' : 'CKUsername'

  // Track changes made later - if any
  var changesImplemented: Array<{
    action: 'changed' | 'added' | 'removed' | 'header' | 'performance' | 'error'
    category: 'n/a' | 'verify' | 'lockee' | 'locktober' | 'keyholder' | 'nickname'
    type: 'role' | 'status'
    result: number | string
  }> = []

  // Get user's current ChastiKey username from users collection or by the override
  const user =
    targetUserType !== 'Self'
      ? targetUserType === 'Snowflake'
        ? // When: Snowflake
          await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.mentions.members.first().id })
        : // When: CKUsername
          await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') })
      : // When: Self
        await routed.bot.DB.get<TrackedUser>('users', { id: routed.author.id })

  const queryBy =
    routed.v.o.user !== undefined
      ? targetUserType === 'Snowflake'
        ? // When: Snowflake
          `Snowflake`
        : // When: CKUsername
          `Username`
      : // When: Self
        `Snowflake`
  const queryValue =
    routed.v.o.user !== undefined
      ? targetUserType === 'Snowflake'
        ? // When: Snowflake
          routed.message.mentions.members.first().id
        : // When: CKUsername
          routed.v.o.user
      : // When: Self
        routed.author.id

  // If target user does not have a record on the server
  if ((!user._id && targetUserType === 'CKUsername') || targetUserType === 'Snowflake') {
    await routed.message.reply(routed.$render('ChastiKey.Error.UserNotFound'))
    return false // Stop here
  }

  // Get Data from new API
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    username: queryBy === 'Username' ? queryValue : undefined,
    discordid: queryBy === 'Snowflake' ? queryValue : undefined,
    showDeleted: true
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    if (lockeeData.data.displayInStats === 2) {
      // Notify in chat what the issue could be
      await Utils.ChastiKey.statsDisabledError(routed)
      return true // Stop here
    }
  }

  // Get Data from new API
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: queryBy === 'Username' ? queryValue : undefined,
    discordid: queryBy === 'Snowflake' ? queryValue : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
    if (keyholderData.data.displayInStats === 2) {
      // Notify in chat what the issue could be
      await Utils.ChastiKey.statsDisabledError(routed)
      return true // Stop here
    }
  }

  ///////////////////////////////////////
  /// Collect User Data for update    ///
  ///////////////////////////////////////
  // * Performance Start: Lockee * //
  updatePerformance.lockee.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Lockee' })

  // Find if any locked locks
  const hasLockedLock = lockeeData.getLocked

  // Fetch some stuff from Discord & ChastiKey
  const discordUser =
    targetUserType !== 'Self'
      ? routed.message.guild.member(user.id)
      : // User calling the command
        routed.message.member

  // Ensure user can actually be found (Has not left, or not some other error)
  if (!discordUser) return false // Stop here

  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple<TrackedAvailableObject>('server-settings', { serverID: routed.message.guild.id, key: /^server\.ck\.roles/ })
  // Already Mapped as Object
  const alreadyMappedIDs = {
    // Lockee
    noviceLockeePink: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.1`),
    noviceLockeeBlue: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.11`),
    intermediateLockeePink: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.2`),
    intermediateLockeeBlue: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.22`),
    experiencedLockeePink: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.3`),
    experiencedLockeeBlue: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.33`),
    devotedLockeePink: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.4`),
    devotedLockeeBlue: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.44`),
    fanaticalLockeePink: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.5`),
    fanaticalLockeeBlue: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.55`),
    // Keyholder
    noviceKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.101`),
    keyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.102`),
    establishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.103`),
    distinguishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.104`),
    renownedKeyholder: alreadyMapped.find((saved) => saved.key === `server.ck.roles.exp.105`),
    // Specials
    unlocked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.1`),
    locked: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.2`),
    locktober2019: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.3`),
    locktober2020: alreadyMapped.find((saved) => saved.key === `server.ck.roles.special.4`)
  }

  // Server Roles
  const role: { [name: string]: Discord.Role } = {
    locked: undefined,
    unlocked: undefined,
    locktober2019: undefined,
    locktober2020: undefined,
    renownedKeyholder: undefined,
    distinguishedKeyholder: undefined,
    establishedKeyholder: undefined,
    keyholder: undefined,
    noviceKeyholder: undefined,
    fanaticalLockeePink: undefined,
    devotedLockeePink: undefined,
    experiencedLockeePink: undefined,
    intermediateLockeePink: undefined,
    noviceLockeePink: undefined,
    fanaticalLockeeBlue: undefined,
    devotedLockeeBlue: undefined,
    experiencedLockeeBlue: undefined,
    intermediateLockeeBlue: undefined,
    noviceLockeeBlue: undefined
  }
  // User Roles
  var discordUserHasRole = {
    locked: false,
    unlocked: false,
    locktober2019: false,
    locktober2020: false,
    renownedKeyholder: false,
    distinguishedKeyholder: false,
    establishedKeyholder: false,
    keyholder: false,
    noviceKeyholder: false,
    fanaticalLockeePink: false,
    devotedLockeePink: false,
    experiencedLockeePink: false,
    intermediateLockeePink: false,
    noviceLockeePink: false,
    fanaticalLockeeBlue: false,
    devotedLockeeBlue: false,
    experiencedLockeeBlue: false,
    intermediateLockeeBlue: false,
    noviceLockeeBlue: false
  }

  // Loop once finding roles for the above variables
  routed.message.guild.roles.cache.forEach((r) => {
    if (alreadyMappedIDs.unlocked) if (r.id === alreadyMappedIDs.unlocked.value) role.unlocked = r
    if (alreadyMappedIDs.locked) if (r.id === alreadyMappedIDs.locked.value) role.locked = r
    if (alreadyMappedIDs.locktober2019) if (r.id === alreadyMappedIDs.locktober2019.value) role.locktober2019 = r
    if (alreadyMappedIDs.locktober2020) if (r.id === alreadyMappedIDs.locktober2020.value) role.locktober2020 = r
    // Keyholder
    if (alreadyMappedIDs.renownedKeyholder) if (r.id === alreadyMappedIDs.renownedKeyholder.value) role.renownedKeyholder = r
    if (alreadyMappedIDs.distinguishedKeyholder) if (r.id === alreadyMappedIDs.distinguishedKeyholder.value) role.distinguishedKeyholder = r
    if (alreadyMappedIDs.establishedKeyholder) if (r.id === alreadyMappedIDs.establishedKeyholder.value) role.establishedKeyholder = r
    if (alreadyMappedIDs.keyholder) if (r.id === alreadyMappedIDs.keyholder.value) role.keyholder = r
    if (alreadyMappedIDs.noviceKeyholder) if (r.id === alreadyMappedIDs.noviceKeyholder.value) role.noviceKeyholder = r
    // Lockee
    if (alreadyMappedIDs.fanaticalLockeePink) if (r.id === alreadyMappedIDs.fanaticalLockeePink.value) role.fanaticalLockeePink = r
    if (alreadyMappedIDs.fanaticalLockeeBlue) if (r.id === alreadyMappedIDs.fanaticalLockeeBlue.value) role.fanaticalLockeeBlue = r
    if (alreadyMappedIDs.devotedLockeePink) if (r.id === alreadyMappedIDs.devotedLockeePink.value) role.devotedLockeePink = r
    if (alreadyMappedIDs.devotedLockeeBlue) if (r.id === alreadyMappedIDs.devotedLockeeBlue.value) role.devotedLockeeBlue = r
    if (alreadyMappedIDs.experiencedLockeePink) if (r.id === alreadyMappedIDs.experiencedLockeePink.value) role.experiencedLockeePink = r
    if (alreadyMappedIDs.experiencedLockeeBlue) if (r.id === alreadyMappedIDs.experiencedLockeeBlue.value) role.experiencedLockeeBlue = r
    if (alreadyMappedIDs.intermediateLockeePink) if (r.id === alreadyMappedIDs.intermediateLockeePink.value) role.intermediateLockeePink = r
    if (alreadyMappedIDs.intermediateLockeeBlue) if (r.id === alreadyMappedIDs.intermediateLockeeBlue.value) role.intermediateLockeeBlue = r
    if (alreadyMappedIDs.noviceLockeePink) if (r.id === alreadyMappedIDs.noviceLockeePink.value) role.noviceLockeePink = r
    if (alreadyMappedIDs.noviceLockeeBlue) if (r.id === alreadyMappedIDs.noviceLockeeBlue.value) role.noviceLockeeBlue = r
  })
  discordUser.roles.cache.forEach((r) => {
    if (alreadyMappedIDs.unlocked) if (r.id === alreadyMappedIDs.unlocked.value) discordUserHasRole.unlocked = true
    if (alreadyMappedIDs.locked) if (r.id === alreadyMappedIDs.locked.value) discordUserHasRole.locked = true
    if (alreadyMappedIDs.locktober2019) if (r.id === alreadyMappedIDs.locktober2019.value) discordUserHasRole.locktober2019 = true
    if (alreadyMappedIDs.locktober2020) if (r.id === alreadyMappedIDs.locktober2020.value) discordUserHasRole.locktober2020 = true
    // Keyholder
    if (alreadyMappedIDs.renownedKeyholder) if (r.id === alreadyMappedIDs.renownedKeyholder.value) discordUserHasRole.renownedKeyholder = true
    if (alreadyMappedIDs.distinguishedKeyholder) if (r.id === alreadyMappedIDs.distinguishedKeyholder.value) discordUserHasRole.distinguishedKeyholder = true
    if (alreadyMappedIDs.establishedKeyholder) if (r.id === alreadyMappedIDs.establishedKeyholder.value) discordUserHasRole.establishedKeyholder = true
    if (alreadyMappedIDs.keyholder) if (r.id === alreadyMappedIDs.keyholder.value) discordUserHasRole.keyholder = true
    if (alreadyMappedIDs.noviceKeyholder) if (r.id === alreadyMappedIDs.noviceKeyholder.value) discordUserHasRole.noviceKeyholder = true
    // Lockee
    if (alreadyMappedIDs.fanaticalLockeePink) if (r.id === alreadyMappedIDs.fanaticalLockeePink.value) discordUserHasRole.fanaticalLockeePink = true
    if (alreadyMappedIDs.fanaticalLockeeBlue) if (r.id === alreadyMappedIDs.fanaticalLockeeBlue.value) discordUserHasRole.fanaticalLockeeBlue = true
    if (alreadyMappedIDs.devotedLockeePink) if (r.id === alreadyMappedIDs.devotedLockeePink.value) discordUserHasRole.devotedLockeePink = true
    if (alreadyMappedIDs.devotedLockeeBlue) if (r.id === alreadyMappedIDs.devotedLockeeBlue.value) discordUserHasRole.devotedLockeeBlue = true
    if (alreadyMappedIDs.experiencedLockeePink) if (r.id === alreadyMappedIDs.experiencedLockeePink.value) discordUserHasRole.experiencedLockeePink = true
    if (alreadyMappedIDs.experiencedLockeeBlue) if (r.id === alreadyMappedIDs.experiencedLockeeBlue.value) discordUserHasRole.experiencedLockeeBlue = true
    if (alreadyMappedIDs.intermediateLockeePink) if (r.id === alreadyMappedIDs.intermediateLockeePink.value) discordUserHasRole.intermediateLockeePink = true
    if (alreadyMappedIDs.intermediateLockeeBlue) if (r.id === alreadyMappedIDs.intermediateLockeeBlue.value) discordUserHasRole.intermediateLockeeBlue = true
    if (alreadyMappedIDs.noviceLockeePink) if (r.id === alreadyMappedIDs.noviceLockeePink.value) discordUserHasRole.noviceLockeePink = true
    if (alreadyMappedIDs.noviceLockeeBlue) if (r.id === alreadyMappedIDs.noviceLockeeBlue.value) discordUserHasRole.noviceLockeeBlue = true
  })

  // Determine which color the user prefers, blue or pink
  var userHasPref = false
  var isChangingLockeeExpRole = false
  const prefPink =
    discordUserHasRole.devotedLockeePink || discordUserHasRole.experiencedLockeePink || discordUserHasRole.intermediateLockeePink || discordUserHasRole.noviceLockeePink
  const prefBlue =
    discordUserHasRole.devotedLockeeBlue || discordUserHasRole.experiencedLockeeBlue || discordUserHasRole.intermediateLockeeBlue || discordUserHasRole.noviceLockeeBlue

  // Ensure user has a color preference already selected, otherwise don't pick one
  if (prefBlue || prefPink) userHasPref = true

  // Cumulative time locked
  const cumulativeTimeLockedMonths = Math.round((lockeeData.data.cumulativeSecondsLocked / 2592000) * 100) / 100

  ///////////////////////////////////////
  /// Role Update: Locked || Unlocked ///
  ///////////////////////////////////////
  // console.log('userHasPref:', userHasPref)
  // console.log('discordUserHasRole.unlocked:', discordUserHasRole.unlocked)
  // console.log('discordUserHasRole.locked:', discordUserHasRole.locked)
  if (role.unlocked || role.locked) {
    try {
      if (userHasPref || discordUserHasRole.unlocked || discordUserHasRole.locked) {
        // When there are locks Locked or not yet unlocked: set the locked role
        if (hasLockedLock.length > 0) {
          // Remove any unlocked role if user has it
          if (discordUserHasRole.unlocked) {
            await discordUser.roles.remove(role.unlocked)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: role.unlocked.name })
          }
          // Add locked role (If not already set)
          if (!discordUserHasRole.locked) {
            await discordUser.roles.add(role.locked)
            changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.locked.name })
          }
        }
        // Else: Set unlocked role & remove any locked role if they have
        else {
          // Remove any locked role if user has it
          if (discordUserHasRole.locked) {
            await discordUser.roles.remove(role.locked)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: role.locked.name })
          }
          // Add unlocked role (If not already set)
          if (!discordUserHasRole.unlocked) {
            await discordUser.roles.add(role.unlocked)
            changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.unlocked.name })
          }
        }
      }
    } catch (e) {
      console.log('CK Update Error updating Locked/Unlocked role')
    }
  }

  ///////////////////////////////////////
  /// Role Update: Experience Level   ///
  ///////////////////////////////////////
  // Fanatical    = 24
  // Devoted      = 12
  // Experienced  =  6
  // Intermediate =  2
  // Novice       =  0
  try {
    const rolesToRemove = [] as Array<{ role: string; name: string }>

    // Devoted
    if (cumulativeTimeLockedMonths >= 24 && userHasPref) {
      // Add Proper Fanatical role
      if (!discordUserHasRole.fanaticalLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.fanaticalLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.fanaticalLockeePink.name })
      }
      if (!discordUserHasRole.fanaticalLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.fanaticalLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.fanaticalLockeeBlue.name })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'devotedLockeePink', name: role.devotedLockeePink.name },
          { role: 'devotedLockeeBlue', name: role.devotedLockeeBlue.name },
          { role: 'experiencedLockeePink', name: role.experiencedLockeePink.name },
          { role: 'experiencedLockeeBlue', name: role.experiencedLockeeBlue.name },
          { role: 'intermediateLockeePink', name: role.intermediateLockeePink.name },
          { role: 'intermediateLockeeBlue', name: role.intermediateLockeeBlue.name },
          { role: 'noviceLockeePink', name: role.noviceLockeePink.name },
          { role: 'noviceLockeeBlue', name: role.noviceLockeeBlue.name }
        )
      }
    }

    // Devoted
    if (cumulativeTimeLockedMonths >= 12 && cumulativeTimeLockedMonths < 24 && userHasPref) {
      // Add Proper Devoted role
      if (!discordUserHasRole.devotedLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.devotedLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.devotedLockeePink.name })
      }
      if (!discordUserHasRole.devotedLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.devotedLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.devotedLockeeBlue.name })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: role.fanaticalLockeePink.name },
          { role: 'fanaticalLockeeBlue', name: role.fanaticalLockeeBlue.name },
          { role: 'experiencedLockeePink', name: role.experiencedLockeePink.name },
          { role: 'experiencedLockeeBlue', name: role.experiencedLockeeBlue.name },
          { role: 'intermediateLockeePink', name: role.intermediateLockeePink.name },
          { role: 'intermediateLockeeBlue', name: role.intermediateLockeeBlue.name },
          { role: 'noviceLockeePink', name: role.noviceLockeePink.name },
          { role: 'noviceLockeeBlue', name: role.noviceLockeeBlue.name }
        )
      }
    }

    // Experienced
    if (cumulativeTimeLockedMonths >= 6 && cumulativeTimeLockedMonths < 12 && userHasPref) {
      // Add Proper Experienced role
      if (!discordUserHasRole.experiencedLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.experiencedLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.experiencedLockeePink.name })
      }
      if (!discordUserHasRole.experiencedLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.experiencedLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.experiencedLockeeBlue.name })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: role.fanaticalLockeePink.name },
          { role: 'fanaticalLockeeBlue', name: role.fanaticalLockeeBlue.name },
          { role: 'devotedLockeePink', name: role.devotedLockeePink.name },
          { role: 'devotedLockeeBlue', name: role.devotedLockeeBlue.name },
          { role: 'intermediateLockeePink', name: role.intermediateLockeePink.name },
          { role: 'intermediateLockeeBlue', name: role.intermediateLockeeBlue.name },
          { role: 'noviceLockeePink', name: role.noviceLockeePink.name },
          { role: 'noviceLockeeBlue', name: role.noviceLockeeBlue.name }
        )
      }
    }

    // Intermediate
    if (cumulativeTimeLockedMonths >= 2 && cumulativeTimeLockedMonths < 6 && userHasPref) {
      // Add Proper Intermediate role
      if (!discordUserHasRole.intermediateLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.intermediateLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.intermediateLockeePink.name })
      }
      if (!discordUserHasRole.intermediateLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.intermediateLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.intermediateLockeeBlue.name })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: role.fanaticalLockeePink.name },
          { role: 'fanaticalLockeeBlue', name: role.fanaticalLockeeBlue.name },
          { role: 'devotedLockeePink', name: role.devotedLockeePink.name },
          { role: 'devotedLockeeBlue', name: role.devotedLockeeBlue.name },
          { role: 'experiencedLockeePink', name: role.experiencedLockeePink.name },
          { role: 'experiencedLockeeBlue', name: role.experiencedLockeeBlue.name },
          { role: 'noviceLockeePink', name: role.noviceLockeePink.name },
          { role: 'noviceLockeeBlue', name: role.noviceLockeeBlue.name }
        )
      }
    }

    // Removal Step
    for (let index = 0; index < rolesToRemove.length; index++) {
      const roleForRemoval = rolesToRemove[index]
      // Ensure user has role before attempting to remove
      if (discordUserHasRole[roleForRemoval.role]) {
        await discordUser.roles.remove(role[roleForRemoval.role])
        changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: roleForRemoval.name })
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Experience role')
  }
  // * Performance End: Lockee * //
  updatePerformance.lockee.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: `${Math.round(updatePerformance.lockee.end - updatePerformance.lockee.start)}ms` })

  ///////////////////////////////////////
  /// Role Update: Locktober          ///
  ///////////////////////////////////////
  if (role.locktober2020 || role.locktober2019) {
    // * Performance Start: Locktober * //
    updatePerformance.locktober.start = performance.now()
    changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Locktober' })

    try {
      // Locktober Data (DB Cached)
      const isLocktoberParticipant2019 = await routed.bot.DB.verify<{ username: string; discordID: string }>('ck-locktober-2019', { discordID: user.id })
      const isLocktoberParticipant2020 = await routed.bot.DB.verify<{ username: string; discordID: string }>('ck-locktober-2020', { discordID: user.id })

      // * 2019 * //
      if (isLocktoberParticipant2019) {
        // User is found in participants list, is missing the role, add the role
        if (!discordUserHasRole.locktober2019) {
          await discordUser.roles.add(role.locktober2019)
          changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: role.locktober2019.name })
        }
      }
      // Else: User is not longer in the participants list
      else {
        // User is NOT found in participants list, remove the role
        if (discordUserHasRole.locktober2019) {
          await discordUser.roles.remove(role.locktober2019)
          changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: role.locktober2019.name })
        }
      }

      // * 2020 * //
      if (isLocktoberParticipant2020) {
        // User is found in participants list, is missing the role, add the role
        if (!discordUserHasRole.locktober2020) {
          await discordUser.roles.add(role.locktober2020)
          changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: role.locktober2020.name })
        }
      }
      // Else: User is not longer in the participants list
      else {
        // User is NOT found in participants list, remove the role
        if (discordUserHasRole.locktober2020) {
          await discordUser.roles.remove(role.locktober2020)
          changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: role.locktober2020.name })
        }
      }
    } catch (e) {
      console.log('CK Update Error updating Locktober role(s)', e)
    }
    // * Performance End: Locktober * //
    updatePerformance.locktober.end = performance.now()
    changesImplemented.push({
      action: 'performance',
      category: 'n/a',
      type: 'status',
      result: `${Math.round(updatePerformance.locktober.end - updatePerformance.locktober.start)}ms`
    })
  }

  ///////////////////////////////////////
  /// Nickname Update                 ///
  ///////////////////////////////////////
  // * Performance Start: Nickname * //
  updatePerformance.nickname.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Nickname' })

  try {
    const currentNickname = discordUser.nickname || discordUser.user.username
    // Lockee Nickname update
    const hasEmojiStatus = /🔒|🔓/.test(currentNickname)
    const hasEmojiLocked = /🔒/.test(currentNickname)
    const hasEmojiUnlocked = /🔓/.test(currentNickname)
    const lockeeStatusPref = user.ChastiKey.preferences.lockee.showStatusInNickname

    // Check if kiera sits at or below the person calling -and- is not the server owner
    const isServerOwner = discordUser.id === routed.message.guild.ownerID
    const isPermissionsIssue = discordUser.roles.highest.comparePositionTo(routed.message.guild.member(routed.bot.client.user.id).roles.highest) > 0

    if (!isPermissionsIssue && !isServerOwner) {
      // When user is in an active lock but has the (unlocked -or- no) emoji
      if (hasLockedLock.length && (hasEmojiUnlocked || !hasEmojiStatus) && (lockeeStatusPref === 'always' || lockeeStatusPref === 'locked') && currentNickname.length < 32) {
        // console.log('Give 🔒 Emoji')
        // Set locked emoji
        await discordUser.setNickname(hasEmojiUnlocked ? currentNickname.replace('🔓', '🔒') : `${currentNickname} 🔒`)
        changesImplemented.push({ action: 'added', category: 'nickname', type: 'status', result: `${currentNickname} 🔒` })
      }
      if (!hasLockedLock.length && (hasEmojiLocked || !hasEmojiStatus) && (lockeeStatusPref === 'always' || lockeeStatusPref === 'unlocked') && currentNickname.length < 32) {
        // console.log('Give 🔓 Emoji')
        // Set unlocked emoji
        await discordUser.setNickname(hasEmojiLocked ? currentNickname.replace('🔒', '🔓') : `${currentNickname} 🔓`)
        changesImplemented.push({ action: 'added', category: 'nickname', type: 'status', result: `${currentNickname} 🔓` })
      }
    } else {
      // Show error for is server owner
      if (isServerOwner) changesImplemented.push({ action: 'error', category: 'nickname', type: 'status', result: routed.$render('Generic.Error.ThisActionFailedServerOwner') })
      if (isPermissionsIssue) changesImplemented.push({ action: 'error', category: 'nickname', type: 'status', result: routed.$render('Generic.Error.RoleTooHightForThisAction') })
    }
  } catch (e) {
    console.log('CK Update Error updating Nickname', e)
    // changesImplemented.push({ action: 'added', category: 'nickname', type: 'role', result: 'Renowned nickname' })
  }
  // * Performance End: Nickname * //
  updatePerformance.nickname.end = performance.now()
  changesImplemented.push({
    action: 'performance',
    category: 'n/a',
    type: 'status',
    result: `${Math.round(updatePerformance.nickname.end - updatePerformance.nickname.start)}ms`
  })

  ///////////////////////////////////////
  /// Role Update: Keyholder Exp      ///
  ///////////////////////////////////////
  // * Performance Start: Keyholder * //
  updatePerformance.keyholder.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Keyholder' })

  try {
    if (
      discordUserHasRole.noviceKeyholder ||
      discordUserHasRole.keyholder ||
      discordUserHasRole.establishedKeyholder ||
      discordUserHasRole.distinguishedKeyholder ||
      discordUserHasRole.renownedKeyholder
    ) {
      const eligibleUpgradeDistinguishedToRenowned = keyholderData.data.keyholderLevel === 5 && !discordUserHasRole.renownedKeyholder
      const eligibleUpgradeEstablishedToDistinguished = keyholderData.data.keyholderLevel === 4 && !discordUserHasRole.distinguishedKeyholder
      const eligibleUpgradeKeyholderToEstablished = keyholderData.data.keyholderLevel === 3 && !discordUserHasRole.establishedKeyholder
      const eligibleUpgradeNoviceToKeyholder = keyholderData.data.keyholderLevel === 2 && !discordUserHasRole.keyholder

      // Distinguished Keyholder -> Renowned Keyholder role
      if (eligibleUpgradeDistinguishedToRenowned) {
        await discordUser.roles.add(role.renownedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: role.renownedKeyholder.name })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`${role.renownedKeyholder.name}\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.distinguishedKeyholder.name })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.establishedKeyholder.name })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.keyholder.name })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.noviceKeyholder.name })
        }
      }

      // Established Keyholder -> Distinguished Keyholder role
      if (eligibleUpgradeEstablishedToDistinguished) {
        await discordUser.roles.add(role.distinguishedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: role.distinguishedKeyholder.name })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`${role.distinguishedKeyholder.name}\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.renownedKeyholder.name })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.establishedKeyholder.name })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.keyholder.name })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.noviceKeyholder.name })
        }
      }

      // Keyholder -> Established Keyholder role
      if (eligibleUpgradeKeyholderToEstablished) {
        await discordUser.roles.add(role.establishedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: role.establishedKeyholder.name })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`${role.establishedKeyholder.name}\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.renownedKeyholder.name })
        }
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.distinguishedKeyholder.name })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.keyholder.name })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.noviceKeyholder.name })
        }
      }

      // Novice -> Keyholder role
      if (eligibleUpgradeNoviceToKeyholder) {
        await discordUser.roles.add(role.keyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: role.keyholder.name })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`${role.keyholder.name}\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.renownedKeyholder.name })
        }
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.distinguishedKeyholder.name })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.establishedKeyholder.name })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: role.noviceKeyholder.name })
        }
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Keyholder Exp role(s)', e)
  }
  // * Performance End: Keyholder * //
  updatePerformance.keyholder.end = performance.now()
  changesImplemented.push({
    action: 'performance',
    category: 'n/a',
    type: 'status',
    result: `${Math.round(updatePerformance.keyholder.end - updatePerformance.keyholder.start)}ms`
  })
  // * Performance End: Full * //
  updatePerformance.full.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: `${Math.round(updatePerformance.full.end - updatePerformance.full.start)}ms` })

  // Print results in chat of changes
  var results: string = `Summary of changes to \`${discordUser.nickname || discordUser.user.username}#${discordUser.user.discriminator}\`\n\`\`\`diff\n`
  var currentCategoryInPrintHasItems = false

  changesImplemented.forEach((change, i) => {
    // Print Header
    if (change.action === 'header') {
      results += `## [ ${change.result} ] ##\n`
      currentCategoryInPrintHasItems = false
    }
    // Print + or - changes
    if (change.action !== 'header' && change.action !== 'performance') {
      results += `${change.action === 'added' || change.action === 'changed' ? '+' : '-'} ${change.action} ${change.type}: ${change.result}\n`
      currentCategoryInPrintHasItems = true
    }
    // Print Performance
    if (change.action === 'performance' && i < changesImplemented.length - 1) {
      // If there's no changes in this section display a message saying so
      if (!currentCategoryInPrintHasItems) results += '\nNo changes\n'
      results += `\n===========================\n--- Time taken: ${change.result}\n\n`
    }
  })

  results += '```'

  await routed.message.reply(results)
  return true
}
