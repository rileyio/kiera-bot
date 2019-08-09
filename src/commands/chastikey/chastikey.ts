import got = require('got');
import * as FormData from 'form-data';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import * as Discord from 'discord.js';
import { TrackedUser } from '../../objects/user';
import { RouterRouted } from '../../router/router';
import { ExportRoutes } from '../../router/routes-exporter';
import { ChastiKeyVerifyResponse } from '../../objects/chastikey';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setUsername,
    example: '{{prefix}}ck username "MyUsername"',
    name: 'ck-set-username',
    validate: '/ck:string/username:string/ckusername=string',
    middleware: [
      Middleware.isUserRegistered
    ],
    permissions: {
      defaultEnabled: false
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
      defaultEnabled: false
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
      defaultEnabled: false
    }
  }
)

/**
 *  Sets username for ChastiKey
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
 *  Recover ChastiKey recent combinations (with optional count to return)
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
    const mergedLocks = [].concat(userPastLocksFromAPIresp.body.locks, userCurrentLocksFromAPIresp.body.locks)

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
  // Lookup user in Kiera's DB
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

  // Get the user from the db in their current state
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))

  // Make request out to ChastiKey to start process
  const postData = new FormData()

  // Statuses
  var isNewRequest = false
  var isSuccessful = false
  var isNotSuccessfulReason = 'Unknown, Try again later.'

  // User not registered with Kiera
  if (!user) {
    await routed.message.reply(Utils.sb(Utils.en.error.userNotRegistered))
    return false; // Stop here
  }

  // Check if verify key has been cached recently
  if (user.ChastiKey.verificationCode !== '' && ((Date.now() - 300000) < user.ChastiKey.verificationCodeRequestedAt)) {
    isNewRequest = false
    isSuccessful = true
  }
  else {
    postData.append('id', routed.message.author.id)
    postData.append('username', routed.message.author.username)
    postData.append('discriminator', routed.message.author.discriminator)

    const { body } = await got.post('https://chastikey.com/api/ella/discordbotqrauthenticator.php', {
      body: postData
    } as any);

    // Convery body to JSON
    const parsedBody = JSON.parse(body) as ChastiKeyVerifyResponse

    console.log(parsedBody);

    if (parsedBody.success) {
      isNewRequest = true
      isSuccessful = true
      // Track User's verification code
      user.ChastiKey.verificationCode = parsedBody.code
      // Commit Verify code to db, to have on hand
      await routed.bot.DB.update('users', userQuery, user)
    }
    else {
      isNotSuccessfulReason = parsedBody.reason || isNotSuccessfulReason
    }
  }

  if (isSuccessful) {
    const QRImgStream = await Utils.ChastiKey.generateVerifyQR(user.ChastiKey.verificationCode)
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