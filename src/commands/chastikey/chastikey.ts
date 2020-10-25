import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import * as Discord from 'discord.js'
import { TrackedUser } from '@/objects/user'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedSession } from '@/objects/session'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    controller: recoverCombos,
    description: 'Help.ChastiKey.RecoverCombinations.Description',
    example: '{{prefix}}ck recover combos 5',
    name: 'ck-account-recover-combos',
    validate: '/ck:string/recover:string/combos:string/count?=number',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: verifyAccount,
    description: 'Help.ChastiKey.Verify.Description',
    example: '{{prefix}}ck verify',
    name: 'ck-account-verify',
    validate: '/ck:string/verify:string',
    middleware: [], // No Middleware - From 4.4.0 and onward this will replace both !register & !ck verify
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: roleCounts,
    description: 'Help.ChastiKey.RoleCounts.Description',
    example: '{{prefix}}ck role counts',
    name: 'ck-role-counts',
    validate: '/ck:string/role:string/counts:string',
    middleware: [],
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: extSession,
    description: 'Help.ChastiKey.CKWeb.Description',
    example: '{{prefix}}ck web',
    name: 'ck-ext-session',
    validate: '/ck:string/web:string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  }
)

/**
 * Sets username for ChastiKey
 * @export
 * @param {RouterRouted} routed
 */
export async function setUsername(routed: RouterRouted) {
  await routed.message.reply(`:information_source: Deprecated command (\`${routed.message.content}\`), please use \`!ck verify\``)
}

/**
 * Recover ChastiKey recent combinations (with optional count to return)
 * @export
 * @param {RouterRouted} routed
 */
export async function recoverCombos(routed: RouterRouted) {
  // Default will be 5 to not clutter the user's DM
  const getCount = routed.v.o.count || 5

  // Get user's past locks
  const resp = await routed.bot.Service.ChastiKey.fetchAPICombinations({
    username: routed.v.o.user ? routed.v.o.user : undefined,
    discordid: !routed.v.o.user ? routed.author.id : undefined
  })

  // Stop if error in lookup
  if (resp.response.status !== 200) {
    await routed.message.author.send(`There has been an error processing your request. Please contact @emma#1366`)
    return true // Stop here
  }

  // Catch: If there are no past locks inform the user
  if (resp.locks.length === 0) {
    await routed.message.author.send(`You have no locks at this time to show, if you believe this is an error please reachout via the \`Kiera Bot\` development/support server.`)
    return true // Stop here
  }

  // Sort locks to display an accurate account of past locks
  const sortedLocks = resp.locks.sort((lA, lB) => {
    var x = lA.timestampUnlocked
    var y = lB.timestampUnlocked
    if (x > y) {
      return -1
    }
    if (x < y) {
      return 1
    }
    return 0
  })

  // Get last x # of locks
  const selectedLocks = sortedLocks.slice(0, getCount)

  var message = `Here are your last (${getCount}) **unlocked** locks (Both Deleted and Not):\n`

  message += `\`\`\``

  selectedLocks.forEach((l, i) => {
    message += `Lock ID         ${l.lockID}\n`
    message += `Was locked by   ${l.lockedBy}\n`
    message += `Unlocked        ${new Date(l.timestampUnlocked * 1000)}\n`
    message += `Combination     ${l.combination}\n`
    if (i < selectedLocks.length - 1) message += `\n` // Add extra space between
  })
  message += `\`\`\``

  await routed.message.reply(`Check your DMs for past unlocked combinations.`)
  await routed.message.author.send(message)

  // Successful end
  return true
}

/**
 * Verify Discord <-> ChastiKey account
 * @export
 * @param {RouterRouted} routed
 */
export async function verifyAccount(routed: RouterRouted) {
  // Statuses
  var isSuccessful = false
  var isNotSuccessfulReason = 'Unknown, Try again later.'

  // User not previously registered with Kiera
  if (!routed.user._id) {
    // Create a record for them like !register would have
    routed.user = new TrackedUser({ id: routed.author.id })
    // Add to DB
    await routed.bot.DB.add('users', routed.user)
  }

  const parsedVerifyDiscordID = await routed.bot.Service.ChastiKey.verifyCKAccountCheck({ discordID: routed.author.id })
  console.log(routed.user.ChastiKey)

  // If user exists & this command is being re-run, try checking if they're verified on the ChastiKey side before
  // Triggering a new verify
  if (!routed.user.ChastiKey.isVerified) {
    // When they are already verified, let them know & update the ChastiKey user record
    if (parsedVerifyDiscordID.status === 200) {
      // Update that we know they're at least verified
      routed.user.ChastiKey.isVerified = true
      routed.user.ChastiKey.username = parsedVerifyDiscordID.username

      await routed.bot.DB.update('users', { id: routed.author.id }, routed.user)
      // We can safely stop here - let the user know nothing more is needed at this time
      await routed.message.reply(routed.$render('ChastiKey.Verify.FastForward'))
      return true // Stop here
    }
  }

  if (parsedVerifyDiscordID.status === 200) {
    await routed.message.reply(routed.$render('ChastiKey.Verify.PreviouslyCompleted'))
    return true
  }

  const verifyResponse = await routed.bot.Service.ChastiKey.verifyCKAccountGetCode(routed.author.id, routed.author.username, routed.author.discriminator)

  if (verifyResponse.success) {
    isSuccessful = true
    // Track User's verification code
    routed.user.ChastiKey.verificationCode = verifyResponse.code
    // Commit Verify code to db, to have on hand
    await routed.bot.DB.update('users', { id: routed.author.id }, routed.user)
  } else {
    isNotSuccessfulReason = verifyResponse.reason || isNotSuccessfulReason
  }

  if (isSuccessful) {
    const QRImgStream = await Utils.ChastiKey.generateVerifyQR(routed.user.ChastiKey.verificationCode)
    // Let user know in a reply to check their DMs
    await routed.message.reply(routed.$render('ChastiKey.Verify.CkeckYourDMs'))
    // Send QR Code via DM
    await routed.message.author.send({
      files: [new Discord.MessageAttachment(QRImgStream, 'QRVerify.png')],
      embed: {
        title: `ChastiKey - User Verification`,
        description: routed.$render('ChastiKey.Verify.DMInstructions'),
        color: 9125611,
        timestamp: new Date(),
        footer: {
          icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
          text: 'QR Generated by Kiera'
        }
      }
    })
  } else {
    // Generate & DM QR code to requestor
    await routed.message.reply(routed.$render('ChastiKey.Verify.NotSuccessfulUsingReason', { reason: isNotSuccessfulReason }))
  }

  // Successful end
  return true
}

export async function roleCounts(routed: RouterRouted) {
  var lgStr = 1

  const counts = {
    ckVerified: 0,
    locked: 0,
    unlocked: 0,
    locktober: 0,
    noviceKh: 0,
    keyholder: 0,
    established: 0,
    distinguished: 0,
    renowned: 0,
    fanatical: 0,
    devoted: 0,
    experienced: 0,
    intermediate: 0,
    noviceLockee: 0
  }

  routed.message.guild.roles.cache.forEach((r) => {
    // Special states
    if (r.name.toLowerCase() === 'chastikey verified') counts.ckVerified = r.members.size
    if (r.name.toLowerCase() === 'locked') counts.locked = r.members.size
    if (r.name.toLowerCase() === 'unlocked') counts.unlocked = r.members.size
    if (r.name.toLowerCase() === 'locktober 2019') counts.locktober = r.members.size
    // Keyholders
    if (r.name.toLowerCase() === 'renowned keyholder') counts.renowned = r.members.size
    if (r.name.toLowerCase() === 'distinguished keyholder') counts.distinguished = r.members.size
    if (r.name.toLowerCase() === 'established keyholder') counts.established = r.members.size
    if (r.name.toLowerCase() === 'keyholder') counts.keyholder = r.members.size
    if (r.name.toLowerCase() === 'novice keyholder') counts.noviceKh = r.members.size
    // Lockees
    if (r.name.toLowerCase() === 'fanatical lockee') counts.fanatical = counts.fanatical + r.members.size
    if (r.name.toLowerCase() === 'devoted lockee') counts.devoted = counts.devoted + r.members.size
    if (r.name.toLowerCase() === 'experienced lockee') counts.experienced = counts.experienced + r.members.size
    if (r.name.toLowerCase() === 'intermediate lockee') counts.intermediate = counts.intermediate + r.members.size
    if (r.name.toLowerCase() === 'novice lockee') counts.noviceLockee = counts.noviceLockee + r.members.size
  })

  // Find largest number in string format
  Object.keys(counts).forEach((key) => {
    // Track which category name is the longest
    if (lgStr < String(counts[key]).length) lgStr = String(counts[key]).length
  })

  var response = `:bar_chart: **Server Role Statistics**\n`
  const cacheSize = routed.message.guild.members.cache.size

  response += `\`\`\``
  response += `Everyone                 # ${routed.message.guild.members.cache.size}\n`
  response += `=========================================\n`
  response += `Verified                 # ${counts.ckVerified} ${arrFrom(lgStr + 3 - strLen(counts.ckVerified)).join(' ')} ${rd(counts.ckVerified / cacheSize)}%\n`
  response += `Locked                   # ${counts.locked} ${arrFrom(lgStr + 3 - strLen(counts.locked)).join(' ')} ${rd(counts.locked / cacheSize)}%\n`
  response += `Unlocked                 # ${counts.unlocked} ${arrFrom(lgStr + 3 - strLen(counts.unlocked)).join(' ')} ${rd(counts.unlocked / cacheSize)}%\n`
  response += `Locktober 2019           # ${counts.locktober} ${arrFrom(lgStr + 3 - strLen(counts.locktober)).join(' ')} ${rd(counts.locktober / cacheSize)}%\n`
  response += `=========================================\n`
  response += `Renowned Keyholder       # ${counts.renowned} ${arrFrom(lgStr + 3 - strLen(counts.renowned)).join(' ')} ${rd(counts.renowned / cacheSize)}%\n`
  response += `Distinguished Keyholder  # ${counts.distinguished} ${arrFrom(lgStr + 3 - strLen(counts.distinguished)).join(' ')} ${rd(counts.distinguished / cacheSize)}%\n`
  response += `Established Keyholder    # ${counts.established} ${arrFrom(lgStr + 3 - strLen(counts.established)).join(' ')} ${rd(counts.established / cacheSize)}%\n`
  response += `Keyholder                # ${counts.keyholder} ${arrFrom(lgStr + 3 - strLen(counts.keyholder)).join(' ')} ${rd(counts.keyholder / cacheSize)}%\n`
  response += `Novice Keyholder         # ${counts.noviceKh} ${arrFrom(lgStr + 3 - strLen(counts.noviceKh)).join(' ')} ${rd(counts.noviceKh / cacheSize)}%\n`
  response += `=========================================\n`
  response += `Fanatical Lockee         # ${counts.fanatical} ${arrFrom(lgStr + 3 - strLen(counts.fanatical)).join(' ')} ${rd(counts.fanatical / cacheSize)}%\n`
  response += `Devoted Lockee           # ${counts.devoted} ${arrFrom(lgStr + 3 - strLen(counts.devoted)).join(' ')} ${rd(counts.devoted / cacheSize)}%\n`
  response += `Experienced Lockee       # ${counts.experienced} ${arrFrom(lgStr + 3 - strLen(counts.experienced)).join(' ')} ${rd(counts.experienced / cacheSize)}%\n`
  response += `Intermediate Lockee      # ${counts.intermediate} ${arrFrom(lgStr + 3 - strLen(counts.intermediate)).join(' ')} ${rd(counts.intermediate / cacheSize)}%\n`
  response += `Novice Lockee            # ${counts.noviceLockee} ${arrFrom(lgStr + 3 - strLen(counts.noviceLockee)).join(' ')} ${rd(counts.noviceLockee / cacheSize)}%\n`
  response += `\`\`\``

  await routed.message.channel.send(response)
  return true
}

function rd(perc: number) {
  var moddedPerc: string
  // Calculate with decimal place adjusted
  moddedPerc = parseFloat(String(perc * 100)).toFixed(2)

  // When less than 10 add leading 0 before returning
  if (Number(moddedPerc) < 10) moddedPerc = `0${moddedPerc}`
  return moddedPerc
}

function strLen(value: number) {
  return String(value).length
}

function arrFrom(array: number) {
  return Array.from(Array(array))
}

export async function extSession(routed: RouterRouted) {
  // Create new Session Object
  const newSession = new TrackedSession({ userID: routed.author.id, generatedFor: 'kiera-ck' })
  // Generate OTL and store in sessions table
  newSession.newOTL()

  // Store new Session w/OTL
  await routed.bot.DB.add<TrackedSession>('sessions', newSession)

  // Inform user of their OTL
  await routed.message.author.send(
    `This is your **Kiera + ChastiKey One Time Login**, __KEEP IT SAFE__, Run the command again to receive a new key \`!ck web\`\n\n**Note:** This will expire in 5 minutes!\n\nUse this to login: ${process.env.API_EXT_DEFAULT_URL}/login/${newSession.otl} \n\n-or- Copy and Paste this in the \`Login Token\` box \`\`\`${newSession.otl}\`\`\``
  )

  return true
}
