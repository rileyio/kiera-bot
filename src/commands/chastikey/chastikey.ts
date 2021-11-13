import * as Discord from 'discord.js'
import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'

import { TrackedSession } from '@/objects/session'
import { TrackedUser } from '@/objects/user/'

export const Routes = ExportRoutes(
  {
    category: 'ChastiKey',
    controller: recoverCombos,
    description: 'Help.ChastiKey.RecoverCombinations.Description',
    example: '{{prefix}}ck recover combos 5',
    middleware: [Middleware.isCKVerified],
    name: 'ck-account-recover-combos',
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    },
    type: 'message',
    validate: '/ck:string/recover:string/combos:string/count?=number'
  },
  {
    category: 'ChastiKey',
    controller: roleCounts,
    description: 'Help.ChastiKey.RoleCounts.Description',
    example: '{{prefix}}ck role counts',
    middleware: [],
    name: 'ck-role-counts',
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    },
    type: 'message',
    validate: '/ck:string/role:string/counts:string'
  },
  {
    category: 'ChastiKey',
    controller: extSession,
    description: 'Help.ChastiKey.CKWeb.Description',
    example: '{{prefix}}ck web',
    middleware: [Middleware.isCKVerified],
    name: 'ck-ext-session',
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    },
    type: 'message',
    validate: '/ck:string/web:string'
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
    discordid: !routed.v.o.user ? routed.author.id : undefined,
    username: routed.v.o.user ? routed.v.o.user : undefined
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
    const x = lA.timestampUnlocked
    const y = lB.timestampUnlocked
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

  let message = `Here are your last (${getCount}) **unlocked** locks (Both Deleted and Not):\n`
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

export async function roleCounts(routed: RouterRouted) {
  let lgStr = 1
  const counts = {
    ckVerified: 0,
    devoted: 0,
    distinguished: 0,
    established: 0,
    experienced: 0,
    fanatical: 0,
    intermediate: 0,
    keyholder: 0,
    locked: 0,
    locktober2019: 0,
    locktober2020: 0,
    locktober2021: 0,
    noviceKh: 0,
    noviceLockee: 0,
    renowned: 0,
    unlocked: 0
  }

  routed.message.guild.roles.cache.forEach((r) => {
    // Special states
    if (r.name.toLowerCase() === 'chastikey verified') counts.ckVerified = r.members.size
    if (r.name.toLowerCase() === 'locked') counts.locked = r.members.size
    if (r.name.toLowerCase() === 'unlocked') counts.unlocked = r.members.size
    if (r.name.toLowerCase() === 'locktober 2019') counts.locktober2019 = r.members.size
    if (r.name.toLowerCase() === 'locktober 2020') counts.locktober2020 = r.members.size
    if (r.name.toLowerCase() === 'locktober 2021') counts.locktober2021 = r.members.size
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

  let response = `:bar_chart: **Server Role Statistics**\n`
  const cacheSize = routed.message.guild.members.cache.size

  response += `\`\`\``
  response += `Everyone                 # ${routed.message.guild.members.cache.size}\n`
  response += `=========================================\n`
  response += `Verified                 # ${counts.ckVerified} ${arrFrom(lgStr + 3 - strLen(counts.ckVerified)).join(' ')} ${rd(counts.ckVerified / cacheSize)}%\n`
  response += `Locked                   # ${counts.locked} ${arrFrom(lgStr + 3 - strLen(counts.locked)).join(' ')} ${rd(counts.locked / cacheSize)}%\n`
  response += `Unlocked                 # ${counts.unlocked} ${arrFrom(lgStr + 3 - strLen(counts.unlocked)).join(' ')} ${rd(counts.unlocked / cacheSize)}%\n`
  response += `Locktober 2019           # ${counts.locktober2019} ${arrFrom(lgStr + 3 - strLen(counts.locktober2019)).join(' ')} ${rd(counts.locktober2019 / cacheSize)}%\n`
  response += `Locktober 2020           # ${counts.locktober2020} ${arrFrom(lgStr + 3 - strLen(counts.locktober2020)).join(' ')} ${rd(counts.locktober2020 / cacheSize)}%\n`
  response += `Locktober 2021           # ${counts.locktober2021} ${arrFrom(lgStr + 3 - strLen(counts.locktober2021)).join(' ')} ${rd(counts.locktober2021 / cacheSize)}%\n`
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
  let moddedPerc: string
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
  const newSession = new TrackedSession({ generatedFor: 'kiera-ck', userID: routed.author.id })
  // Generate OTL and store in sessions table
  newSession.newOTL()

  // Store new Session w/OTL
  await routed.bot.DB.add('sessions', newSession)

  // Inform user of their OTL
  await routed.message.author.send(
    `This is your **Kiera + ChastiKey One Time Login**, __KEEP IT SAFE__, Run the command again to receive a new key \`!ck web\`\n\n**Note:** This will expire in 5 minutes!\n\nUse this to login: ${process.env.API_EXT_DEFAULT_URL}/login/${newSession.otl} \n\n-or- Copy and Paste this in the \`Login Token\` box \`\`\`${newSession.otl}\`\`\``
  )

  return true
}
