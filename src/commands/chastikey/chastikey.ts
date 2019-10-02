import got = require('got');
import * as FormData from 'form-data';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import * as Discord from 'discord.js';
import { TrackedUser } from '../../objects/user';
import { RouterRouted } from '../../router/router';
import { ExportRoutes } from '../../router/routes-exporter';
import { ChastiKeyVerifyResponse, TrackedChastiKeyUserAPIFetch } from '../../objects/chastikey';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setUsername,
    example: '{{prefix}}ck username MyUsername',
    name: 'ck-set-username',
    validate: '/ck:string/username:string/ckusername=string',
    middleware: [
      Middleware.isUserRegistered
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: recoverCombos,
    example: '{{prefix}}ck recover combos 5',
    name: 'ck-account-recover-combos',
    validate: '/ck:string/recover:string/combos:string/count?=number',
    middleware: [
      Middleware.isUserRegistered
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: verifyAccount,
    example: '{{prefix}}ck verify',
    name: 'ck-account-verify',
    validate: '/ck:string/verify:string',
    middleware: [
      Middleware.isUserRegistered
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: update,
    example: '{{prefix}}ck update',
    name: 'ck-update',
    validate: '/ck:string/update:string/user?=string',
    middleware: [
      Middleware.isUserRegistered,
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    }
  }
)

/**
 * Sets username for ChastiKey
 * @export
 * @param {RouterRouted} routed
 */
export async function setUsername(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

  // Get the user from the db in their current state
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))
  // Change/Update TrackedChastiKey.Username Prop
  user.ChastiKey.username = routed.v.o.ckusername
  // Commit change to db
  const updateResult = await routed.bot.DB.update('users', userQuery, user)

  if (updateResult > 0) {
    await routed.message.author.send(`:white_check_mark: ChastiKey Username now set to: \`${routed.v.o.ckusername}\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck username ${routed.v.o.ckusername}`)
    // Successful end
    return true
  }
  else {
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck username ${routed.v.o.ckusername} -> update unsuccessful!`)
    // Unsuccessful end
    return false
  }
}

/**
 * Recover ChastiKey recent combinations (with optional count to return)
 * @export
 * @param {RouterRouted} routed
 */
export async function recoverCombos(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

  // Get the user from the db in their current state
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))

  if (user) {
    // Default will be 5 to not clutter the user's DM
    const getCount = routed.v.o.count || 5

    // Get user's past locks
    const userPastLocksFromAPIresp = await got(`https://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=1&bot=Kiera`, { json: true })
    const userCurrentLocksFromAPIresp = await got(`https://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=0&bot=Kiera`, { json: true })

    // Merge Deleted and Non-deleted locks
    const mergedLocks = [].concat(userPastLocksFromAPIresp.body.locks || [], userCurrentLocksFromAPIresp.body.locks || [])

    // Catch: If there are no past locks inform the user
    if (mergedLocks.length === 0) {
      await routed.message.author.send(`You have no locks at this time to show, if you believe this is an error please reachout via the \`Kiera Bot\` development/support server.`)
      return true
    }

    // Sort locks to display an accurate account of past locks
    mergedLocks.sort((lA, lB) => {
      var x = lA.timestampUnlocked;
      var y = lB.timestampUnlocked;
      if (x > y) { return -1; }
      if (x < y) { return 1; }
      return 0;
    })

    // Remove any that are NOT: UnlockedReal
    mergedLocks.map(l => l.status === 'UnlockedReal')

    // Get last x # of locks
    const selectedLocks = mergedLocks.slice(0, getCount)

    var message = `Here are your last (${getCount}) **unlocked** locks (Both Deleted and Not):\n`

    message += `\`\`\``

    selectedLocks.forEach((l, i) => {
      message += `Was locked by   ${l.lockedBy}\n`
      message += `Was deleted?    ${l.lockDeleted === 1 ? 'Yes' : 'No'}\n`
      message += `Unlocked        ${new Date(l.timestampUnlocked * 1000)}\n`
      message += `Combination     ${l.combination}\n`
      if (i < (selectedLocks.length - 1)) message += `\n` // Add extra space between
    })
    message += `\`\`\``

    await routed.message.reply(`Check your DMs for past unlocked combinations.`)
    await routed.message.author.send(message)
  }

  // Successful end
  return true
}

/**
 * Verify Discord <-> ChastiKey account
 * @export
 * @param {RouterRouted} routed
 */
export async function verifyAccount(routed: RouterRouted) {
  // Get the user from the db in their current state
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

  // Make request out to ChastiKey to start process
  const postData = new FormData()

  // Statuses
  var isSuccessful = false
  var isNotSuccessfulReason = 'Unknown, Try again later.'

  // User not registered with Kiera
  if (!user) {
    await routed.message.reply(Utils.sb(Utils.en.error.userNotRegistered))
    return false; // Stop here
  }

  // Check if verify key has been cached recently
  postData.append('id', routed.message.author.id)
  postData.append('username', routed.message.author.username)
  postData.append('discriminator', routed.message.author.discriminator)

  const { body } = await got.post('https://chastikey.com/api/kiera/discordbotqrauthenticator.php', {
    body: postData
  } as any);

  // Convery body to JSON
  const parsedBody = JSON.parse(body) as ChastiKeyVerifyResponse

  // console.log(parsedBody);

  if (parsedBody.success) {
    isSuccessful = true
    // Track User's verification code
    user.ChastiKey.verificationCode = parsedBody.code
    // Commit Verify code to db, to have on hand
    await routed.bot.DB.update('users', { id: routed.user.id }, user)
  }
  else {
    isNotSuccessfulReason = parsedBody.reason || isNotSuccessfulReason
  }

  if (isSuccessful) {
    const QRImgStream = Utils.ChastiKey.generateVerifyQR(user.ChastiKey.verificationCode)
    // Let user know in a reply to check their DMs
    await routed.message.reply(Utils.sb(Utils.en.chastikey.verifyCkeckYourDMs))
    // Send QR Code via DM
    await routed.message.author.send({
      files: [new Discord.Attachment(QRImgStream, 'QRVerify.png')],
      embed: {
        title: `ChastiKey - User Verification`,
        description: Utils.sb(Utils.en.chastikey.verifyDMInstructions),
        color: 9125611,
        timestamp: new Date(),
        footer: {
          icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
          text: 'QR Generated by Kiera'
        },
      }
    })
  }
  else {
    // Generate & DM QR code to requestor
    await routed.message.reply(Utils.sb(Utils.en.chastikey.verifyNotSuccessfulUsingReason, { reason: isNotSuccessfulReason }))
  }

  // Successful end
  return true
}

/**
 * ChastiKey Update (For: Roles)
 * @export
 * @param {RouterRouted} routed
 */
export async function update(routed: RouterRouted) {
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
  const targetUserType: 'Self' | 'Snowflake' | 'CKUsername' = (routed.v.o.user === undefined)
    ? 'Self'
    : (routed.message.mentions.members.first() ? 'Snowflake' : 'CKUsername')

  // Track changes made later - if any
  var changesImplemented: Array<{ action: 'changed' | 'added' | 'removed', type: 'role', result: string }> = []

  // Get user's current ChastiKey username from users collection or by the override
  const user = (targetUserType !== 'Self')
    ? (targetUserType === 'Snowflake')
      ? await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.mentions.members.first().id })
      // Fallback: When Snowflake target user does not have a record - return an empty ChastiKey username record
      || (<TrackedUser>{ __notStored: true, ChastiKey: { username: '' } })
      // When type is a CK username, try to find based off that
      : await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') })
      // Fallback: When CK usernamed target user does not have a username set - return an empty ChastiKey username record
      || (<TrackedUser>{ __notStored: true, ChastiKey: { username: '' } })
    // User calling the command
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id })

  // If user does not have a ChastiKey username set, warn them
  if (user.ChastiKey.username === '') {
    await routed.message.reply(Utils.sb((targetUserType === 'Self') ? Utils.en.chastikey.usernameNotSet : Utils.en.chastikey.usernameNotSetByOwner))
    return false; // Stop here
  }

  ///////////////////////////////////////
  /// Collect User Data for update    ///
  ///////////////////////////////////////
  // Get user's Current live Locks / Data
  const { body }: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`https://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=0&bot=Kiera`, { json: true })

  // Check status code from CK server
  if (body.response[0].status === 400) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.usernameNoResultsFromServer))
    return false; // Stop here
  }

  // Locktober Data (DB Cached)
  const isLocktoberParticipant = await routed.bot.DB.verify<{ username: string, discordID: number }>('ck-locktober', { discordID: Number(user.id) })

  // From API -or- Default
  const fromAPI = body.locks || []

  // Find if any locked locks
  const hasLockedLock = fromAPI.filter(lock => lock.status === 'Locked' || lock.status === 'ReadyToUnlock')

  // Fetch some stuff from Discord & ChastiKey
  const discordUser =
    (targetUserType !== 'Self')
      ? await routed.message.guild.fetchMember(user.id)
      // User calling the command
      : routed.message.member

  // Ensure user can actually be found (Has not left, or not some other error)
  if (!discordUser) return false // Stop here
  var calculatedCumulative = 0
  var successfullyCalculatedCumulative = false
  // Server Roles
  var role: { [name: string]: Discord.Role } = {
    locked: undefined,
    unlocked: undefined,
    locktober: undefined,
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
    if (r.hexColor.toLowerCase() === '#dd3c68' && r.name.toLowerCase() === 'devoted lockee') role.devotedLockeePink = r
    if (r.hexColor.toLowerCase() === '#0359fd' && r.name.toLowerCase() === 'devoted lockee') role.devotedLockeeBlue = r
    if (r.hexColor.toLowerCase() === '#db4a71' && r.name.toLowerCase() === 'experienced lockee') role.experiencedLockeePink = r
    if (r.hexColor.toLowerCase() === '#206bfa' && r.name.toLowerCase() === 'experienced lockee') role.experiencedLockeeBlue = r
    if (r.hexColor.toLowerCase() === '#f3688b' && r.name.toLowerCase() === 'intermediate lockee') role.intermediateLockeePink = r
    if (r.hexColor.toLowerCase() === '#4383fc' && r.name.toLowerCase() === 'intermediate lockee') role.intermediateLockeeBlue = r
    if (r.hexColor.toLowerCase() === '#f592ac' && r.name.toLowerCase() === 'novice lockee') role.noviceLockeePink = r
    if (r.hexColor.toLowerCase() === '#3498db' && r.name.toLowerCase() === 'novice lockee') role.noviceLockeeBlue = r
  })
  discordUser.roles.forEach(r => {
    if (r.name.toLowerCase() === 'locked') discordUserHasRole.locked = true
    if (r.name.toLowerCase() === 'unlocked') discordUserHasRole.unlocked = true
    if (r.name.toLowerCase() === 'locktober 2019') discordUserHasRole.locktober = true
    if (r.hexColor.toLowerCase() === '#dd3c68' && r.name.toLowerCase() === 'devoted lockee') discordUserHasRole.devotedLockeePink = true
    if (r.hexColor.toLowerCase() === '#0359fd' && r.name.toLowerCase() === 'devoted lockee') discordUserHasRole.devotedLockeeBlue = true
    if (r.hexColor.toLowerCase() === '#db4a71' && r.name.toLowerCase() === 'experienced lockee') discordUserHasRole.experiencedLockeePink = true
    if (r.hexColor.toLowerCase() === '#206bfa' && r.name.toLowerCase() === 'experienced lockee') discordUserHasRole.experiencedLockeeBlue = true
    if (r.hexColor.toLowerCase() === '#f3688b' && r.name.toLowerCase() === 'intermediate lockee') discordUserHasRole.intermediateLockeePink = true
    if (r.hexColor.toLowerCase() === '#4383fc' && r.name.toLowerCase() === 'intermediate lockee') discordUserHasRole.intermediateLockeeBlue = true
    if (r.hexColor.toLowerCase() === '#f592ac' && r.name.toLowerCase() === 'novice lockee') discordUserHasRole.noviceLockeePink = true
    if (r.hexColor.toLowerCase() === '#3498db' && r.name.toLowerCase() === 'novice lockee') discordUserHasRole.noviceLockeeBlue = true
  })

  // Calculate cumulative time locked
  try {
    const userPastLocksFromAPIresp = await got(`http://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=1&bot=Kiera`, { json: true })
    const userCurrentLocksFromAPIresp = await got(`http://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=0&bot=Kiera`, { json: true })
    // For any dates with a { ... end: 0 } set the 0 to the current timestamp (still active)
    const allLockeesLocks = [].concat(userPastLocksFromAPIresp.body.locks || [], userCurrentLocksFromAPIresp.body.locks || []).map(d => {
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
  try {
    // When there are locks Locked or not yet unlocked: set the locked role
    if (hasLockedLock.length > 0) {
      // Remove any unlocked role if user has it
      if (discordUserHasRole.unlocked) { await discordUser.removeRole(role.unlocked); changesImplemented.push({ action: 'removed', type: 'role', result: 'Unlocked' }); }
      // Add locked role (If not already set)
      if (!discordUserHasRole.locked) { await discordUser.addRole(role.locked); changesImplemented.push({ action: 'added', type: 'role', result: 'Locked' }); }
    }
    // Else: Set unlocked role & remove any locked role if they have
    else {
      // Remove any locked role if user has it
      if (discordUserHasRole.locked) { await discordUser.removeRole(role.locked); changesImplemented.push({ action: 'removed', type: 'role', result: 'Locked' }); }
      // Add unlocked role (If not already set)
      if (!discordUserHasRole.unlocked) { await discordUser.addRole(role.unlocked); changesImplemented.push({ action: 'added', type: 'role', result: 'Unlocked' }); }
    }
  } catch (e) { console.log('CK Update Error updating Locked/Unlocked role') }

  ///////////////////////////////////////
  /// Role Update: Experience Level   ///
  ///////////////////////////////////////
  // Devoted      = 12
  // Experienced  =  6
  // Intermediate =  2
  // Novice       =  0
  try {
    if (successfullyCalculatedCumulative) {
      // Determine which color the user prefers, blue or pink
      var userHasPref = false
      var isChanging = false
      const prefPink = discordUserHasRole.devotedLockeePink || discordUserHasRole.experiencedLockeePink || discordUserHasRole.intermediateLockeePink || discordUserHasRole.noviceLockeePink
      const prefBlue = discordUserHasRole.devotedLockeeBlue || discordUserHasRole.experiencedLockeeBlue || discordUserHasRole.intermediateLockeeBlue || discordUserHasRole.noviceLockeeBlue

      // Ensure user has a color preference already selected, otherwise don't pick one
      if (prefBlue || prefPink) userHasPref = true

      // Devoted
      if (calculatedCumulative >= 12 && userHasPref) {
        // Add Proper Devoted role
        if (!discordUserHasRole.devotedLockeePink && prefPink) { isChanging = true; await discordUser.addRole(role.devotedLockeePink); changesImplemented.push({ action: 'added', type: 'role', result: '(Pink) Devoted Lockee' }); }
        if (!discordUserHasRole.devotedLockeeBlue && prefBlue) { isChanging = true; await discordUser.addRole(role.devotedLockeeBlue); changesImplemented.push({ action: 'added', type: 'role', result: '(Blue) Devoted Lockee' }); }

        // Remove other roles
        if (isChanging) {
          if (discordUserHasRole.experiencedLockeePink) { await discordUser.removeRole(role.experiencedLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Experienced Lockee' }); }
          if (discordUserHasRole.experiencedLockeeBlue) { await discordUser.removeRole(role.experiencedLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Experienced Lockee' }); }
          if (discordUserHasRole.intermediateLockeePink) { await discordUser.removeRole(role.intermediateLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Intermediate Lockee' }); }
          if (discordUserHasRole.intermediateLockeeBlue) { await discordUser.removeRole(role.intermediateLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Intermediate Lockee' }); }
          if (discordUserHasRole.noviceLockeePink) { await discordUser.removeRole(role.noviceLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Novice Lockee' }); }
          if (discordUserHasRole.noviceLockeeBlue) { await discordUser.removeRole(role.noviceLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Novice Lockee' }); }
        }
      }

      // Experienced
      if (calculatedCumulative >= 6 && calculatedCumulative < 12 && userHasPref) {
        // Add Proper Experienced role
        if (!discordUserHasRole.experiencedLockeePink && prefPink) { isChanging = true; await discordUser.addRole(role.experiencedLockeePink); changesImplemented.push({ action: 'added', type: 'role', result: '(Pink) Experienced Lockee' }); }
        if (!discordUserHasRole.experiencedLockeeBlue && prefBlue) { isChanging = true; await discordUser.addRole(role.experiencedLockeeBlue); changesImplemented.push({ action: 'added', type: 'role', result: '(Blue) Experienced Lockee' }); }

        // Remove other roles
        if (isChanging) {
          if (discordUserHasRole.devotedLockeePink) { await discordUser.removeRole(role.devotedLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Devoted Lockee' }); }
          if (discordUserHasRole.devotedLockeeBlue) { await discordUser.removeRole(role.devotedLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Devoted Lockee' }); }
          if (discordUserHasRole.intermediateLockeePink) { await discordUser.removeRole(role.intermediateLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Intermediate Lockee' }); }
          if (discordUserHasRole.intermediateLockeeBlue) { await discordUser.removeRole(role.intermediateLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Intermediate Lockee' }); }
          if (discordUserHasRole.noviceLockeePink) { await discordUser.removeRole(role.noviceLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Novice Lockee' }); }
          if (discordUserHasRole.noviceLockeeBlue) { await discordUser.removeRole(role.noviceLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Novice Lockee' }); }
        }
      }

      // Intermediate
      if (calculatedCumulative >= 2 && calculatedCumulative < 6 && userHasPref) {
        // Add Proper Intermediate role
        if (!discordUserHasRole.intermediateLockeePink && prefPink) { isChanging = true; await discordUser.addRole(role.intermediateLockeePink); changesImplemented.push({ action: 'added', type: 'role', result: '(Pink) Intermediate Lockee' }); }
        if (!discordUserHasRole.intermediateLockeeBlue && prefBlue) { isChanging = true; await discordUser.addRole(role.intermediateLockeeBlue); changesImplemented.push({ action: 'added', type: 'role', result: '(Blue) Intermediate Lockee' }); }

        // Remove other roles
        if (isChanging) {
          if (discordUserHasRole.devotedLockeePink) { await discordUser.removeRole(role.devotedLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Devoted Lockee' }); }
          if (discordUserHasRole.devotedLockeeBlue) { await discordUser.removeRole(role.devotedLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Devoted Lockee' }); }
          if (discordUserHasRole.experiencedLockeePink) { await discordUser.removeRole(role.experiencedLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Experienced Lockee' }); }
          if (discordUserHasRole.experiencedLockeeBlue) { await discordUser.removeRole(role.experiencedLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Experienced Lockee' }); }
          if (discordUserHasRole.noviceLockeePink) { await discordUser.removeRole(role.noviceLockeePink); changesImplemented.push({ action: 'removed', type: 'role', result: '(Pink) Novice Lockee' }); }
          if (discordUserHasRole.noviceLockeeBlue) { await discordUser.removeRole(role.noviceLockeeBlue); changesImplemented.push({ action: 'removed', type: 'role', result: '(Blue) Novice Lockee' }); }
        }
      }
    }
  } catch (e) { console.log('CK Update Error updating Experience role') }

  ///////////////////////////////////////
  /// Role Update: Locktober          ///
  ///////////////////////////////////////
  try {
    if (isLocktoberParticipant) {
      // User is found in participants list, is missing the role, add the role
      if (!discordUserHasRole.locktober) { await discordUser.addRole(role.locktober); changesImplemented.push({ action: 'added', type: 'role', result: 'Locktober 2019' }); }
    }
    // Else: User is not longer in the participants list
    else {
      // User is NOT found in participants list, remove the role
      if (discordUserHasRole.locktober) { await discordUser.removeRole(role.locktober); changesImplemented.push({ action: 'removed', type: 'role', result: 'Locktober 2019' }); }
    }
  } catch (e) { console.log('CK Update Error updating Locktober 2019 role') }

  // Print results in chat of changes
  var results: string = `Summary of changes to \`${discordUser.nickname || discordUser.user.username}#${discordUser.user.discriminator}\`\n\`\`\``
  if (changesImplemented.length > 0) changesImplemented.forEach(change => results += `${change.action} ${change.type}: ${change.result}\n`)
  else results += 'No changes to be made!'
  results += '```'

  await routed.message.reply(results)
  return true
}