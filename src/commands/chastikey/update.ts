import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import * as Discord from 'discord.js'
import { TrackedUser } from '@/objects/user'
import { RouterRouted, ExportRoutes } from '@/router'
import { performance } from 'perf_hooks'

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
    if (r.name.toLowerCase() === 'locked') role.locked = r
    if (r.name.toLowerCase() === 'unlocked') role.unlocked = r
    if (r.name.toLowerCase() === 'locktober 2019') role.locktober2019 = r
    if (r.name.toLowerCase() === 'locktober 2020') role.locktober2020 = r
    if (r.name.toLowerCase() === 'renowned keyholder') role.renownedKeyholder = r
    if (r.name.toLowerCase() === 'distinguished keyholder') role.distinguishedKeyholder = r
    if (r.name.toLowerCase() === 'established keyholder') role.establishedKeyholder = r
    if (r.name.toLowerCase() === 'keyholder') role.keyholder = r
    if (r.name.toLowerCase() === 'novice keyholder') role.noviceKeyholder = r
    if (r.id === '747759781309055009') role.fanaticalLockeePink = r
    if (r.id === '745964234432577566') role.fanaticalLockeeBlue = r
    if (r.id === '535495268578361345') role.devotedLockeePink = r
    if (r.id === '535464527798599680') role.devotedLockeeBlue = r
    if (r.id === '535495266166505492') role.experiencedLockeePink = r
    if (r.id === '535464218552434688') role.experiencedLockeeBlue = r
    if (r.id === '535495259832975373') role.intermediateLockeePink = r
    if (r.id === '535463909910380554') role.intermediateLockeeBlue = r
    if (r.id === '477751398499614720') role.noviceLockeePink = r
    if (r.id === '474693333118353439') role.noviceLockeeBlue = r
  })
  discordUser.roles.cache.forEach((r) => {
    if (r.name.toLowerCase() === 'locked') discordUserHasRole.locked = true
    if (r.name.toLowerCase() === 'unlocked') discordUserHasRole.unlocked = true
    if (r.name.toLowerCase() === 'locktober 2019') discordUserHasRole.locktober2019 = true
    if (r.name.toLowerCase() === 'locktober 2020') discordUserHasRole.locktober2020 = true
    if (r.name.toLowerCase() === 'renowned keyholder') discordUserHasRole.renownedKeyholder = true
    if (r.name.toLowerCase() === 'distinguished keyholder') discordUserHasRole.distinguishedKeyholder = true
    if (r.name.toLowerCase() === 'established keyholder') discordUserHasRole.establishedKeyholder = true
    if (r.name.toLowerCase() === 'keyholder') discordUserHasRole.keyholder = true
    if (r.name.toLowerCase() === 'novice keyholder') discordUserHasRole.noviceKeyholder = true
    if (r.id === '747759781309055009') discordUserHasRole.fanaticalLockeePink = true
    if (r.id === '745964234432577566') discordUserHasRole.fanaticalLockeeBlue = true
    if (r.id === '535495268578361345') discordUserHasRole.devotedLockeePink = true
    if (r.id === '535464527798599680') discordUserHasRole.devotedLockeeBlue = true
    if (r.id === '535495266166505492') discordUserHasRole.experiencedLockeePink = true
    if (r.id === '535464218552434688') discordUserHasRole.experiencedLockeeBlue = true
    if (r.id === '535495259832975373') discordUserHasRole.intermediateLockeePink = true
    if (r.id === '535463909910380554') discordUserHasRole.intermediateLockeeBlue = true
    if (r.id === '477751398499614720') discordUserHasRole.noviceLockeePink = true
    if (r.id === '474693333118353439') discordUserHasRole.noviceLockeeBlue = true
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
  try {
    if (userHasPref || discordUserHasRole.unlocked || discordUserHasRole.locked) {
      // When there are locks Locked or not yet unlocked: set the locked role
      if (hasLockedLock.length > 0) {
        // Remove any unlocked role if user has it
        if (discordUserHasRole.unlocked) {
          await discordUser.roles.remove(role.unlocked)
          changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: 'Unlocked' })
        }
        // Add locked role (If not already set)
        if (!discordUserHasRole.locked) {
          await discordUser.roles.add(role.locked)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: 'Locked' })
        }
      }
      // Else: Set unlocked role & remove any locked role if they have
      else {
        // Remove any locked role if user has it
        if (discordUserHasRole.locked) {
          await discordUser.roles.remove(role.locked)
          changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: 'Locked' })
        }
        // Add unlocked role (If not already set)
        if (!discordUserHasRole.unlocked) {
          await discordUser.roles.add(role.unlocked)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: 'Unlocked' })
        }
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Locked/Unlocked role')
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
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Fanatical Lockee' })
      }
      if (!discordUserHasRole.fanaticalLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.fanaticalLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Fanatical Lockee' })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'devotedLockeePink', name: '(Pink) Devoted Lockee' },
          { role: 'devotedLockeeBlue', name: '(Blue) Devoted Lockee' },
          { role: 'experiencedLockeePink', name: '(Pink) Experienced Lockee' },
          { role: 'experiencedLockeeBlue', name: '(Blue) Experienced Lockee' },
          { role: 'intermediateLockeePink', name: '(Pink) Intermediate Lockee' },
          { role: 'intermediateLockeeBlue', name: '(Blue) Intermediate Lockee' },
          { role: 'noviceLockeePink', name: '(Pink) Novice Lockee' },
          { role: 'noviceLockeeBlue', name: '(Blue) Novice Lockee' }
        )
      }
    }

    // Devoted
    if (cumulativeTimeLockedMonths >= 12 && cumulativeTimeLockedMonths < 24 && userHasPref) {
      // Add Proper Devoted role
      if (!discordUserHasRole.devotedLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.devotedLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Devoted Lockee' })
      }
      if (!discordUserHasRole.devotedLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.devotedLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Devoted Lockee' })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: '(Pink) Fanatical Lockee' },
          { role: 'fanaticalLockeeBlue', name: '(Blue) Fanatical Lockee' },
          { role: 'experiencedLockeePink', name: '(Pink) Experienced Lockee' },
          { role: 'experiencedLockeeBlue', name: '(Blue) Experienced Lockee' },
          { role: 'intermediateLockeePink', name: '(Pink) Intermediate Lockee' },
          { role: 'intermediateLockeeBlue', name: '(Blue) Intermediate Lockee' },
          { role: 'noviceLockeePink', name: '(Pink) Novice Lockee' },
          { role: 'noviceLockeeBlue', name: '(Blue) Novice Lockee' }
        )
      }
    }

    // Experienced
    if (cumulativeTimeLockedMonths >= 6 && cumulativeTimeLockedMonths < 12 && userHasPref) {
      // Add Proper Experienced role
      if (!discordUserHasRole.experiencedLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.experiencedLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Experienced Lockee' })
      }
      if (!discordUserHasRole.experiencedLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.experiencedLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Experienced Lockee' })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: '(Pink) Fanatical Lockee' },
          { role: 'fanaticalLockeeBlue', name: '(Blue) Fanatical Lockee' },
          { role: 'devotedLockeePink', name: '(Pink) Devoted Lockee' },
          { role: 'devotedLockeeBlue', name: '(Blue) Devoted Lockee' },
          { role: 'intermediateLockeePink', name: '(Pink) Intermediate Lockee' },
          { role: 'intermediateLockeeBlue', name: '(Blue) Intermediate Lockee' },
          { role: 'noviceLockeePink', name: '(Pink) Novice Lockee' },
          { role: 'noviceLockeeBlue', name: '(Blue) Novice Lockee' }
        )
      }
    }

    // Intermediate
    if (cumulativeTimeLockedMonths >= 2 && cumulativeTimeLockedMonths < 6 && userHasPref) {
      // Add Proper Intermediate role
      if (!discordUserHasRole.intermediateLockeePink && prefPink) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.intermediateLockeePink)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Intermediate Lockee' })
      }
      if (!discordUserHasRole.intermediateLockeeBlue && prefBlue) {
        isChangingLockeeExpRole = true
        await discordUser.roles.add(role.intermediateLockeeBlue)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Intermediate Lockee' })
      }

      // Remove other roles
      if (isChangingLockeeExpRole) {
        rolesToRemove.push(
          { role: 'fanaticalLockeePink', name: '(Pink) Fanatical Lockee' },
          { role: 'fanaticalLockeeBlue', name: '(Blue) Fanatical Lockee' },
          { role: 'devotedLockeePink', name: '(Pink) Devoted Lockee' },
          { role: 'devotedLockeeBlue', name: '(Blue) Devoted Lockee' },
          { role: 'experiencedLockeePink', name: '(Pink) Experienced Lockee' },
          { role: 'experiencedLockeeBlue', name: '(Blue) Experienced Lockee' },
          { role: 'noviceLockeePink', name: '(Pink) Novice Lockee' },
          { role: 'noviceLockeeBlue', name: '(Blue) Novice Lockee' }
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
        changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: 'Locktober 2019' })
      }
    }
    // Else: User is not longer in the participants list
    else {
      // User is NOT found in participants list, remove the role
      if (discordUserHasRole.locktober2019) {
        await discordUser.roles.remove(role.locktober2019)
        changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: 'Locktober 2019' })
      }
    }

    // * 2020 * //
    if (isLocktoberParticipant2020) {
      // User is found in participants list, is missing the role, add the role
      if (!discordUserHasRole.locktober2020) {
        await discordUser.roles.add(role.locktober2020)
        changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: 'Locktober 2020' })
      }
    }
    // Else: User is not longer in the participants list
    else {
      // User is NOT found in participants list, remove the role
      if (discordUserHasRole.locktober2020) {
        await discordUser.roles.remove(role.locktober2020)
        changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: 'Locktober 2020' })
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
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Renowned Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Distinguished Keyholder' })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Established Keyholder' })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }

      // Established Keyholder -> Distinguished Keyholder role
      if (eligibleUpgradeEstablishedToDistinguished) {
        await discordUser.roles.add(role.distinguishedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Distinguished Keyholder' })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Distinguished Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Established Keyholder' })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }

      // Keyholder -> Established Keyholder role
      if (eligibleUpgradeKeyholderToEstablished) {
        await discordUser.roles.add(role.establishedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Established Keyholder' })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Established Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })
        }
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Distinguished Keyholder' })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.roles.remove(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }

      // Novice -> Keyholder role
      if (eligibleUpgradeNoviceToKeyholder) {
        await discordUser.roles.add(role.keyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Keyholder' })

        // Print in Audit log
        await routed.bot.channel.auditLog.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${
            discordUser.nickname || discordUser.user.username
          }#${discordUser.user.discriminator}\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.roles.remove(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })
        }
        if (discordUserHasRole.distinguishedKeyholder) {
          await discordUser.roles.remove(role.distinguishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Distinguished Keyholder' })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.roles.remove(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Established Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.roles.remove(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Keyholder Exp role(s)')
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
