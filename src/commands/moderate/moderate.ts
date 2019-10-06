import * as Middleware from '../../middleware';
import * as XRegex from 'xregexp';
import { ExportRoutes } from '../../router/routes-exporter';
import { RouterRouted } from '../../router/router';
import { TrackedMutedUser } from '../../objects/user';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Moderate',
    commandTarget: 'none',
    controller: mute,
    example: '{{prefix}}mod mute emma#1366',
    name: 'mod-mute-user',
    validate: '/mod:string/mute:string/user=string/reason?=string',
    middleware: [
      Middleware.isModerator
    ],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    commandTarget: 'none',
    controller: unMute,
    example: '{{prefix}}mod unmute emma#1366',
    name: 'mod-unmute-user',
    validate: '/mod:string/unmute:string/user=string',
    middleware: [
      Middleware.isModerator
    ],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    commandTarget: 'none',
    controller: activeMutes,
    example: '{{prefix}}mod list muted',
    name: 'mod-muted-list',
    validate: '/mod:string/list:string/muted:string',
    middleware: [
      Middleware.isModerator
    ],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    commandTarget: 'none',
    controller: lookupMutes,
    example: '{{prefix}}mod lookup mute emma#1366',
    name: 'mod-mute-lookup-list',
    validate: '/mod:string/lookup:string/mute:string/user=string',
    middleware: [
      Middleware.isModerator
    ],
    permissions: {
      serverOnly: true
    }
  }
)

export async function mute(routed: RouterRouted) {
  const muteRole = routed.message.guild.roles.find(r => r.name === 'Temporary Mute')
  const regex = XRegex('^((?<username>(?!@|#|:|`).*)\\#(?<discriminator>[0-9]{4,5}))$', 'i')
  const match = XRegex.exec(routed.v.o.user, regex)
  const username = match['username']
  const discriminator = match['discriminator']

  // Error in username passed
  if (!username || !discriminator) {
    await routed.message.reply('This command requires a Username & Discriminator, like this (__But with no @__) `emma#1366`')
    return false
  }

  const targetUser = routed.message.guild.members.find(m =>
    m.user.username.toLocaleLowerCase() === username.toLocaleLowerCase() && m.user.discriminator === discriminator)

  // Could not find user
  if (!targetUser) {
    await routed.message.reply('Could not find the requested user, make sure you\'re searching based off their username and not nickname.')
    return false
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.user.id) {
    await routed.message.reply('Cannot call the command upon yourself!')
    return false
  }

  const mutedUserRecord = new TrackedMutedUser({
    id: targetUser.id,
    username: targetUser.user.username,
    discriminator: targetUser.user.username,
    nickname: targetUser.nickname,
    serverID: routed.message.guild.id,
    reason: routed.v.o.reason || '<blank>',
    roles: targetUser.roles.map(r => { return { id: r.id, name: r.name } })
  })

  // Store a record of the muted user's info into Kiera's DB for later if/when unmuted to return roles
  await routed.bot.DB.add('muted-users', mutedUserRecord)

  // Now assign the user the mute role removing all previous as well
  await targetUser.removeRoles(targetUser.roles)
  await targetUser.addRole(muteRole)

  await routed.message.channel.send(`:mute: **Muted User**\nUser = \`${routed.v.o.user}\`\nReason = \`${mutedUserRecord.reason}\`\nRoles Preserved = \`${mutedUserRecord.roles.map(r => r.name).join(' ')}\``)
  return true
}

export async function unMute(routed: RouterRouted) {
  const muteRole = routed.message.guild.roles.find(r => r.name === 'Temporary Mute')
  const regex = XRegex('^((?<username>(?!@|#|:|`).*)\\#(?<discriminator>[0-9]{4,5}))$', 'i')
  const match = XRegex.exec(routed.v.o.user, regex)
  const username = match['username']
  const discriminator = match['discriminator']

  // Error in username passed
  if (!username || !discriminator) {
    await routed.message.reply('This command requires a Username & Discriminator, like this (__But with no @__) `emma#1366`')
    return false
  }

  const targetUser = routed.message.guild.members.find(m =>
    m.user.username.toLocaleLowerCase() === username.toLocaleLowerCase() && m.user.discriminator === discriminator)

  // Could not find user
  if (!targetUser) {
    await routed.message.reply('Could not find the requested user, make sure you\'re searching based off their username and not nickname.')
    return false
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.user.id) {
    await routed.message.reply('Cannot call the command upon yourself!')
    return false
  }

  // Query user's Mute record in Kiera's DB
  const mutedUserRecord = new TrackedMutedUser(await routed.bot.DB.get<TrackedMutedUser>('muted-users', { id: targetUser.id, active: true }))

  if (!mutedUserRecord._id) {
    await routed.message.reply('Could not find an active mute record for this user!')
    return false
  }

  // Update Mute record
  await routed.bot.DB.update<TrackedMutedUser>('muted-users', { id: mutedUserRecord.id }, { $set: { active: false, removedAt: Date.now() } }, { atomic: true })

  // Now remove the user's mute role adding back all previous roles
  await targetUser.removeRole(muteRole)
  await targetUser.addRoles(mutedUserRecord.roles.map(r => r.id))

  await routed.message.channel.send(`:mute: **UnMuted User**\nUser = \`${routed.v.o.user}\`\nReason = \`${mutedUserRecord.reason}\`\nRoles Preserved = \`${mutedUserRecord.roles.map(r => r.name).join(' ')}\``)
  return true
}

export async function activeMutes(routed: RouterRouted) {
  const mutedRecordsRaw = await routed.bot.DB.getMultiple<TrackedMutedUser>('muted-users', { serverID: routed.message.guild.id, active: true })
  const mutedRecords = mutedRecordsRaw.map(m => new TrackedMutedUser(m))

  var response = `:mute: **Muted Users List**\n`
  response += '```'
  mutedRecords.forEach(m => {
    const userOnServer = routed.message.guild.members.find(u => u.id === m.id)
    const dateFormatted = new Date(m.timestamp)
    // If still on the server
    if (userOnServer) response += `${userOnServer.user.username}#${userOnServer.user.discriminator}\n  ## Muted: ${dateFormatted.toUTCString()}\n  ## Reason: ${m.reason}\n\n`
    else response += `${m.username}#${m.discriminator} __(user left the server)__\n  ## Muted: ${dateFormatted.toUTCString()}\n  ## Reason: ${m.reason}\n\n`
  })
  response += '```'

  await routed.message.reply(response)
}

export async function lookupMutes(routed: RouterRouted) {
  const regex = XRegex('^((?<username>(?!@|#|:|`).*)\\#(?<discriminator>[0-9]{4,5}))$', 'i')
  const match = XRegex.exec(routed.v.o.user, regex)
  const username = match['username']
  const discriminator = match['discriminator']

  // Error in username passed
  if (!username || !discriminator) {
    await routed.message.reply('This command requires a Username & Discriminator, like this (__But with no @__) `emma#1366`')
    return false
  }

  const targetUser = routed.message.guild.members.find(m =>
    m.user.username.toLocaleLowerCase() === username.toLocaleLowerCase() && m.user.discriminator === discriminator)
  const mutedRecordsRaw = await routed.bot.DB.getMultiple<TrackedMutedUser>('muted-users', { serverID: routed.message.guild.id, id: targetUser.id })

  // Could not find user
  if (!mutedRecordsRaw) {
    await routed.message.reply('Could not find the requested user, make sure you\'re searching based off their username and not nickname.')
    return false
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.user.id) {
    await routed.message.reply('Cannot call the command upon yourself!')
    return false
  }

  const mutedRecords = mutedRecordsRaw.map(m => new TrackedMutedUser(m))

  var response = `:mute: **Muted User Lookup**\n`
  response += '```'
  mutedRecords.forEach(m => {
    const dateFormatted = new Date(m.timestamp)
    // If still on the server
    if (targetUser) response += `${targetUser.user.username}#${targetUser.user.discriminator} (${m.active ? `Active` : 'Not-Active'})\n  ## Muted: ${dateFormatted.toUTCString()}\n  ## Reason: ${m.reason}\n\n`
    else response += `${m.username}#${m.discriminator} (${m.active ? `Active` : 'Not-Active'}) __(user left the server)__\n  ## Muted: ${dateFormatted.toUTCString()}\n  ## Reason: ${m.reason} ${!m.active ? `## Unmuted: ${m.removedAt}` : ``}\n\n`
  })
  response += '```'

  await routed.message.reply(response)
}