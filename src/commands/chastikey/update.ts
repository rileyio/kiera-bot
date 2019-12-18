import got = require('got')
import * as APIUrls from '@/api-urls'
import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import * as Discord from 'discord.js'
import { TrackedUser } from '@/objects/user'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedChastiKeyUserAPIFetch, TrackedChastiKeyKeyholderStatistics, ChastiKeyVerifyDiscordID } from '@/objects/chastikey'
import { performance } from 'perf_hooks'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  commandTarget: 'author',
  controller: update,
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
    keyholder: { start: 0, end: 0 }
  }

  // Check if user calling this command is targeting a different user
  if (routed.v.o.user !== undefined) {
    // Restrict Update upon other users to Keyholder or above
    const khRole = routed.message.guild.roles.find(r => r.name.toLowerCase() === 'keyholder')
    // User calling this command must be higher than the khRole to call update upon another user than themself
    if (routed.message.member.highestRole.position < khRole.position) {
      await routed.message.reply(Utils.sb(Utils.en.chastikey.keyholderOrAboveRoleRequired))
      return false // Stop the user here
    }
  }

  // The user being targeted is Type
  const targetUserType: 'Self' | 'Snowflake' | 'CKUsername' = routed.v.o.user === undefined ? 'Self' : routed.message.mentions.members.first() ? 'Snowflake' : 'CKUsername'

  // Track changes made later - if any
  var changesImplemented: Array<{
    action: 'changed' | 'added' | 'removed' | 'header' | 'performance'
    category: 'n/a' | 'verify' | 'lockee' | 'locktober' | 'keyholder'
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
        await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id })

  ///////////////////////////////////////
  /// ChastiKey + Discord  Verify     ///
  ///////////////////////////////////////
  // * Performance Start: Verify * //
  updatePerformance.verify.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'ChastiKey + Discord Verify' })

  const verifyURI =
    routed.v.o.user !== undefined
      ? targetUserType === 'Snowflake'
        ? // When: Snowflake
          `${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${routed.message.mentions.members.first().id}`
        : // When: CKUsername
          `${APIUrls.ChastiKey.VerifyDiscordID}?username=${routed.v.o.user}`
      : // When: Self
        `${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${routed.user.id}`
  var verifyAPIResp: got.Response<ChastiKeyVerifyDiscordID> = await got(verifyURI, { json: true })
  var parsedVerifyDiscordID = new ChastiKeyVerifyDiscordID(verifyAPIResp.body)

  // If target user does not have a record on the server
  if ((!user._id && targetUserType === 'CKUsername') || targetUserType === 'Snowflake') {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userNotFound))
    return false // Stop here
  }

  // If the user verify lookup failed on someone that is no longer verified on the ChastiKey side (mostly just for testing/the odd time that a user needs to be un-verified)
  if (parsedVerifyDiscordID.status === 400 && user.ChastiKey.isVerified && targetUserType === 'Self') {
    // Try looking up the user by username instead
    console.log('User lookup Special Condition: fallback to username')
    verifyAPIResp = await got(`${APIUrls.ChastiKey.VerifyDiscordID}?username=${user.ChastiKey.username}`, { json: true })
    parsedVerifyDiscordID = new ChastiKeyVerifyDiscordID(verifyAPIResp.body)
    // If its still showing status === 400, then update the record
    if (verifyAPIResp.body.status === 400) {
      user.ChastiKey.isVerified = false
      changesImplemented.push({ action: 'removed', category: 'verify', type: 'status', result: 'verified' })
      await routed.bot.DB.update<TrackedUser>(
        'users',
        { id: routed.user.id },
        {
          $set: { 'ChastiKey.isVerified': false }
        },
        { atomic: true }
      )
    }
  }

  // Update user's record in Kiera's DB if any changes
  if (parsedVerifyDiscordID.status === 200) {
    if (!user.ChastiKey.isVerified && parsedVerifyDiscordID.discordID !== null && parsedVerifyDiscordID.verified)
      changesImplemented.push({ action: 'added', category: 'verify', type: 'status', result: 'verified' })
    if (user.ChastiKey.isVerified && parsedVerifyDiscordID.discordID === null && !parsedVerifyDiscordID.verified)
      changesImplemented.push({ action: 'removed', category: 'verify', type: 'status', result: 'verified' })
    // Update that we know they're at least verified
    await routed.bot.DB.update<TrackedUser>(
      'users',
      { id: routed.user.id },
      {
        $set: {
          'ChastiKey.isVerified': parsedVerifyDiscordID.discordID !== null && parsedVerifyDiscordID.verified,
          'ChastiKey.username': parsedVerifyDiscordID.username
        }
      },
      { atomic: true }
    )
  }
  // * Performance End: Verify * //
  updatePerformance.verify.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: `${Math.round(updatePerformance.verify.end - updatePerformance.verify.start)}ms` })

  ///////////////////////////////////////
  /// Collect User Data for update    ///
  ///////////////////////////////////////
  // * Performance Start: Lockee * //
  updatePerformance.lockee.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Lockee' })

  // Get user's Current live Locks / Data
  const { body }: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${user.ChastiKey.username}`, { json: true })
  // Check status code from CK server
  if (body.status === 400) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userNotFoundRemote))
    return false // Stop here
  }

  // From API -or- Default
  const fromAPI = body.locks || []

  // Find if any locked locks
  const hasLockedLock = fromAPI.filter(lock => lock.status === 'Locked' || lock.status === 'ReadyToUnlock')

  // console.log('hasLockedLock:', hasLockedLock)

  // Fetch some stuff from Discord & ChastiKey
  const discordUser =
    targetUserType !== 'Self'
      ? await routed.message.guild.fetchMember(user.id)
      : // User calling the command
        routed.message.member

  // Ensure user can actually be found (Has not left, or not some other error)
  if (!discordUser) return false // Stop here
  var calculatedCumulative = 0
  var successfullyCalculatedCumulative = false
  // Server Roles
  var role: { [name: string]: Discord.Role } = {
    locked: undefined,
    unlocked: undefined,
    locktober: undefined,
    renownedKeyholder: undefined,
    establishedKeyholder: undefined,
    keyholder: undefined,
    noviceKeyholder: undefined,
    devotedLockeePink: undefined,
    experiencedLockeePink: undefined,
    intermediateLockeePink: undefined,
    noviceLockeePink: undefined,
    devotedLockeeBlue: undefined,
    experiencedLockeeBlue: undefined,
    intermediateLockeeBlue: undefined,
    noviceLockeeBlue: undefined
  }
  // User Roles
  var discordUserHasRole = {
    locked: false,
    unlocked: false,
    locktober: false,
    renownedKeyholder: false,
    establishedKeyholder: false,
    keyholder: false,
    noviceKeyholder: false,
    devotedLockeePink: false,
    experiencedLockeePink: false,
    intermediateLockeePink: false,
    noviceLockeePink: false,
    devotedLockeeBlue: false,
    experiencedLockeeBlue: false,
    intermediateLockeeBlue: false,
    noviceLockeeBlue: false
  }

  // Loop once finding roles for the above variables
  routed.message.guild.roles.forEach(r => {
    if (r.name.toLowerCase() === 'locked') role.locked = r
    if (r.name.toLowerCase() === 'unlocked') role.unlocked = r
    if (r.name.toLowerCase() === 'locktober 2019') role.locktober = r
    if (r.name.toLowerCase() === 'renowned keyholder') role.renownedKeyholder = r
    if (r.name.toLowerCase() === 'established keyholder') role.establishedKeyholder = r
    if (r.name.toLowerCase() === 'keyholder') role.keyholder = r
    if (r.name.toLowerCase() === 'novice keyholder') role.noviceKeyholder = r
    if (r.id === '535495268578361345' || r.id === '627557066382245888') role.devotedLockeePink = r
    if (r.id === '535464527798599680' || r.id === '627557412794007552') role.devotedLockeeBlue = r
    if (r.id === '535495266166505492' || r.id === '627557512677163029') role.experiencedLockeePink = r
    if (r.id === '535464218552434688' || r.id === '627557489495506944') role.experiencedLockeeBlue = r
    if (r.id === '535495259832975373' || r.id === '627556836056367139') role.intermediateLockeePink = r
    if (r.id === '535463909910380554' || r.id === '627519997559701504') role.intermediateLockeeBlue = r
    if (r.id === '477751398499614720' || r.id === '627556385646837780') role.noviceLockeePink = r
    if (r.id === '474693333118353439' || r.id === '627550374856884238') role.noviceLockeeBlue = r
  })
  discordUser.roles.forEach(r => {
    if (r.name.toLowerCase() === 'locked') discordUserHasRole.locked = true
    if (r.name.toLowerCase() === 'unlocked') discordUserHasRole.unlocked = true
    if (r.name.toLowerCase() === 'locktober 2019') discordUserHasRole.locktober = true
    if (r.name.toLowerCase() === 'renowned keyholder') discordUserHasRole.renownedKeyholder = true
    if (r.name.toLowerCase() === 'established keyholder') discordUserHasRole.establishedKeyholder = true
    if (r.name.toLowerCase() === 'keyholder') discordUserHasRole.keyholder = true
    if (r.name.toLowerCase() === 'novice keyholder') discordUserHasRole.noviceKeyholder = true
    if (r.id === '535495268578361345' || r.id === '627557066382245888') discordUserHasRole.devotedLockeePink = true
    if (r.id === '535464527798599680' || r.id === '627557412794007552') discordUserHasRole.devotedLockeeBlue = true
    if (r.id === '535495266166505492' || r.id === '627557512677163029') discordUserHasRole.experiencedLockeePink = true
    if (r.id === '535464218552434688' || r.id === '627557489495506944') discordUserHasRole.experiencedLockeeBlue = true
    if (r.id === '535495259832975373' || r.id === '627556836056367139') discordUserHasRole.intermediateLockeePink = true
    if (r.id === '535463909910380554' || r.id === '627519997559701504') discordUserHasRole.intermediateLockeeBlue = true
    if (r.id === '477751398499614720' || r.id === '627556385646837780') discordUserHasRole.noviceLockeePink = true
    if (r.id === '474693333118353439' || r.id === '627550374856884238') discordUserHasRole.noviceLockeeBlue = true
  })

  // Determine which color the user prefers, blue or pink
  var userHasPref = false
  var isChangingLockeeExpRole = false
  const prefPink = discordUserHasRole.devotedLockeePink || discordUserHasRole.experiencedLockeePink || discordUserHasRole.intermediateLockeePink || discordUserHasRole.noviceLockeePink
  const prefBlue = discordUserHasRole.devotedLockeeBlue || discordUserHasRole.experiencedLockeeBlue || discordUserHasRole.intermediateLockeeBlue || discordUserHasRole.noviceLockeeBlue

  // Ensure user has a color preference already selected, otherwise don't pick one
  if (prefBlue || prefPink) userHasPref = true

  // Calculate cumulative time locked
  try {
    // For any dates with a { ... end: 0 } set the 0 to the current timestamp (still active)
    const allLockeesLocks = [].concat(fromAPI || []).map(d => {
      // Insert current date on existing locked locks that are not deleted
      // console.log(d.timestampUnlocked === 0 && d.status === 'Locked' && d.lockDeleted === 0, d.timestampLocked)

      // Remove unlocked time if the lock status is: Locked, Deleted and has a Completion timestamp
      if (d.timestampUnlocked > 0 && d.status === 'Locked' && d.lockDeleted === 1) {
        d.timestampUnlocked = 0
      }

      if (d.timestampUnlocked === 0 && (d.status === 'Locked' || d.status === 'ReadyToUnlock') && d.lockDeleted === 0) {
        d.timestampUnlocked = Math.round(Date.now() / 1000)
      }

      // Transform data a little
      return { start: d.timestampLocked, end: d.timestampUnlocked }
    })

    // Calculate cumulative using algorithm
    const cumulativeCalc = Utils.Date.calculateCumulativeRange(allLockeesLocks)
    calculatedCumulative = Math.round((cumulativeCalc.cumulative / 2592000) * 100) / 100
    if (Number(calculatedCumulative) !== NaN) successfullyCalculatedCumulative = true
  } catch (error) {
    console.log('CK Error building cumulative time')
  }

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
          await discordUser.removeRole(role.unlocked)
          changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: 'Unlocked' })
        }
        // Add locked role (If not already set)
        if (!discordUserHasRole.locked) {
          await discordUser.addRole(role.locked)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: 'Locked' })
        }
      }
      // Else: Set unlocked role & remove any locked role if they have
      else {
        // Remove any locked role if user has it
        if (discordUserHasRole.locked) {
          await discordUser.removeRole(role.locked)
          changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: 'Locked' })
        }
        // Add unlocked role (If not already set)
        if (!discordUserHasRole.unlocked) {
          await discordUser.addRole(role.unlocked)
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
  // Devoted      = 12
  // Experienced  =  6
  // Intermediate =  2
  // Novice       =  0
  try {
    if (successfullyCalculatedCumulative) {
      // Devoted
      if (calculatedCumulative >= 12 && userHasPref) {
        // Add Proper Devoted role
        if (!discordUserHasRole.devotedLockeePink && prefPink) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.devotedLockeePink)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Devoted Lockee' })
        }
        if (!discordUserHasRole.devotedLockeeBlue && prefBlue) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.devotedLockeeBlue)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Devoted Lockee' })
        }

        // Remove other roles
        if (isChangingLockeeExpRole) {
          if (discordUserHasRole.experiencedLockeePink) {
            await discordUser.removeRole(role.experiencedLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Experienced Lockee' })
          }
          if (discordUserHasRole.experiencedLockeeBlue) {
            await discordUser.removeRole(role.experiencedLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Experienced Lockee' })
          }
          if (discordUserHasRole.intermediateLockeePink) {
            await discordUser.removeRole(role.intermediateLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Intermediate Lockee' })
          }
          if (discordUserHasRole.intermediateLockeeBlue) {
            await discordUser.removeRole(role.intermediateLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Intermediate Lockee' })
          }
          if (discordUserHasRole.noviceLockeePink) {
            await discordUser.removeRole(role.noviceLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Novice Lockee' })
          }
          if (discordUserHasRole.noviceLockeeBlue) {
            await discordUser.removeRole(role.noviceLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Novice Lockee' })
          }
        }
      }

      // Experienced
      if (calculatedCumulative >= 6 && calculatedCumulative < 12 && userHasPref) {
        // Add Proper Experienced role
        if (!discordUserHasRole.experiencedLockeePink && prefPink) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.experiencedLockeePink)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Experienced Lockee' })
        }
        if (!discordUserHasRole.experiencedLockeeBlue && prefBlue) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.experiencedLockeeBlue)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Experienced Lockee' })
        }

        // Remove other roles
        if (isChangingLockeeExpRole) {
          if (discordUserHasRole.devotedLockeePink) {
            await discordUser.removeRole(role.devotedLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Devoted Lockee' })
          }
          if (discordUserHasRole.devotedLockeeBlue) {
            await discordUser.removeRole(role.devotedLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Devoted Lockee' })
          }
          if (discordUserHasRole.intermediateLockeePink) {
            await discordUser.removeRole(role.intermediateLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Intermediate Lockee' })
          }
          if (discordUserHasRole.intermediateLockeeBlue) {
            await discordUser.removeRole(role.intermediateLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Intermediate Lockee' })
          }
          if (discordUserHasRole.noviceLockeePink) {
            await discordUser.removeRole(role.noviceLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Novice Lockee' })
          }
          if (discordUserHasRole.noviceLockeeBlue) {
            await discordUser.removeRole(role.noviceLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Novice Lockee' })
          }
        }
      }

      // Intermediate
      if (calculatedCumulative >= 2 && calculatedCumulative < 6 && userHasPref) {
        // Add Proper Intermediate role
        if (!discordUserHasRole.intermediateLockeePink && prefPink) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.intermediateLockeePink)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Pink) Intermediate Lockee' })
        }
        if (!discordUserHasRole.intermediateLockeeBlue && prefBlue) {
          isChangingLockeeExpRole = true
          await discordUser.addRole(role.intermediateLockeeBlue)
          changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: '(Blue) Intermediate Lockee' })
        }

        // Remove other roles
        if (isChangingLockeeExpRole) {
          if (discordUserHasRole.devotedLockeePink) {
            await discordUser.removeRole(role.devotedLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Devoted Lockee' })
          }
          if (discordUserHasRole.devotedLockeeBlue) {
            await discordUser.removeRole(role.devotedLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Devoted Lockee' })
          }
          if (discordUserHasRole.experiencedLockeePink) {
            await discordUser.removeRole(role.experiencedLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Experienced Lockee' })
          }
          if (discordUserHasRole.experiencedLockeeBlue) {
            await discordUser.removeRole(role.experiencedLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Experienced Lockee' })
          }
          if (discordUserHasRole.noviceLockeePink) {
            await discordUser.removeRole(role.noviceLockeePink)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Pink) Novice Lockee' })
          }
          if (discordUserHasRole.noviceLockeeBlue) {
            await discordUser.removeRole(role.noviceLockeeBlue)
            changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: '(Blue) Novice Lockee' })
          }
        }
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
    const isLocktoberParticipant = await routed.bot.DB.verify<{ username: string; discordID: string }>('ck-locktober', { discordID: user.id })

    if (isLocktoberParticipant) {
      // User is found in participants list, is missing the role, add the role
      if (!discordUserHasRole.locktober) {
        await discordUser.addRole(role.locktober)
        changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: 'Locktober 2019' })
      }
    }
    // Else: User is not longer in the participants list
    else {
      // User is NOT found in participants list, remove the role
      if (discordUserHasRole.locktober) {
        await discordUser.removeRole(role.locktober)
        changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: 'Locktober 2019' })
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Locktober 2019 role')
  }
  // * Performance End: Locktober * //
  updatePerformance.locktober.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: `${Math.round(updatePerformance.locktober.end - updatePerformance.locktober.start)}ms` })

  ///////////////////////////////////////
  /// Role Update: Keyholder Exp      ///
  ///////////////////////////////////////
  // * Performance Start: Keyholder * //
  updatePerformance.keyholder.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Keyholder' })

  try {
    if (discordUserHasRole.noviceKeyholder || discordUserHasRole.keyholder || discordUserHasRole.establishedKeyholder || discordUserHasRole.renownedKeyholder) {
      // Check their KH stats to see if eligible for a Role upgrade
      const khData = new TrackedChastiKeyKeyholderStatistics(await routed.bot.DB.get<TrackedChastiKeyKeyholderStatistics>('ck-keyholders', { username: user.ChastiKey.username }))
      const eligibleUpgradeEstablishedKeyholderToRenownedKeyholder =
        khData.totalLocksManaged >= 1500 && !discordUserHasRole.renownedKeyholder && Date.now() / 1000 - khData.timestampFirstKeyheld >= 86400 * 182
      const eligibleUpgradeKeyholderToEstablishedKeyholder =
        khData.totalLocksManaged >= 100 && khData.totalLocksManaged < 1500 && !discordUserHasRole.establishedKeyholder && Date.now() / 1000 - khData.timestampFirstKeyheld >= 86400 * 60
      const eligibleUpgradeNoviceToKeyholder = khData.totalLocksManaged >= 10 && khData.totalLocksManaged < 100 && !discordUserHasRole.keyholder

      // Established Keyholder -> Renowned Keyholder role
      if (eligibleUpgradeEstablishedKeyholderToRenownedKeyholder) {
        await discordUser.addRole(role.renownedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })

        // Print in Audit log
        await routed.bot.auditLogChannel.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Renowned Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${discordUser.nickname || discordUser.user.username}#${
            discordUser.user.discriminator
          }\``
        )

        // Remove other roles
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.removeRole(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Established Keyholder' })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.removeRole(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.removeRole(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }

      // Keyholder -> Established Keyholder role
      if (eligibleUpgradeKeyholderToEstablishedKeyholder) {
        await discordUser.addRole(role.establishedKeyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Established Keyholder' })

        // Print in Audit log
        await routed.bot.auditLogChannel.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Established Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${discordUser.nickname || discordUser.user.username}#${
            discordUser.user.discriminator
          }\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.removeRole(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })
        }
        if (discordUserHasRole.keyholder) {
          await discordUser.removeRole(role.keyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.removeRole(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }

      // Novice -> Keyholder role
      if (eligibleUpgradeNoviceToKeyholder) {
        await discordUser.addRole(role.keyholder)
        changesImplemented.push({ action: 'added', category: 'keyholder', type: 'role', result: 'Keyholder' })

        // Print in Audit log
        await routed.bot.auditLogChannel.send(
          `:robot: **ChastiKey Keyholder Level Up**\nUpgraded to = \`Keyholder\`\nServer = \`${discordUser.guild.name}\`\nTo = \`@${discordUser.nickname || discordUser.user.username}#${
            discordUser.user.discriminator
          }\``
        )

        // Remove other roles
        if (discordUserHasRole.renownedKeyholder) {
          await discordUser.removeRole(role.renownedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Renowned Keyholder' })
        }
        if (discordUserHasRole.establishedKeyholder) {
          await discordUser.removeRole(role.establishedKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Established Keyholder' })
        }
        if (discordUserHasRole.noviceKeyholder) {
          await discordUser.removeRole(role.noviceKeyholder)
          changesImplemented.push({ action: 'removed', category: 'keyholder', type: 'role', result: 'Novice Keyholder' })
        }
      }
    }
  } catch (e) {
    console.log('CK Update Error updating Keyholder Exp role(s)')
  }
  // * Performance End: Keyholder * //
  updatePerformance.keyholder.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: `${Math.round(updatePerformance.keyholder.end - updatePerformance.keyholder.start)}ms` })
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
