import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'

import { GuildMember } from 'discord.js'
import { TrackedMutedUser } from '@/objects/user/'

export const Routes = ExportRoutes(
  {
    category: 'Moderate',
    controller: mute,
    description: 'Help.Moderate.MuteUser',
    example: '{{prefix}}mod mute 526039977247899649',
    middleware: [Middleware.isModerator],
    name: 'mod-mute-user',
    permissions: {
      serverOnly: true
    },
    type: 'message',
    validate: '/mod:string/mute:string/user=string/reason?=string'
  },
  {
    category: 'Moderate',
    controller: unMute,
    description: 'Help.Moderate.UnmuteUser',
    example: '{{prefix}}mod unmute 526039977247899649',
    middleware: [Middleware.isModerator],
    name: 'mod-unmute-user',
    permissions: {
      serverOnly: true
    },
    type: 'message',
    validate: '/mod:string/unmute:string/user=string'
  },
  {
    category: 'Moderate',
    controller: activeMutes,
    description: 'Help.Moderate.MuteListMuted',
    example: '{{prefix}}mod list muted',
    middleware: [Middleware.isModerator],
    name: 'mod-muted-list',
    permissions: {
      serverOnly: true
    },
    type: 'message',
    validate: '/mod:string/list:string/muted:string'
  },
  {
    category: 'Moderate',
    controller: lookupMutes,
    description: 'Help.Moderate.MuteLookup',
    example: '{{prefix}}mod lookup mute 526039977247899649',
    middleware: [Middleware.isModerator],
    name: 'mod-mute-lookup-list',
    permissions: {
      serverOnly: true
    },
    type: 'message',
    validate: '/mod:string/lookup:string/mute:string/user=string'
  }
)

export async function mute(routed: RouterRouted) {
  const muteRole = routed.message.guild.roles.cache.find((r) => r.name === 'Temporary Mute')
  const kieraInGuild = routed.message.guild.members.cache.get(routed.bot.client.user.id)
  const targetUser = await routed.message.guild.members.fetch(routed.v.o.user)

  // Could not find user
  if (!targetUser) {
    await routed.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  // See if one is already active and stored for this user
  const hasActiveMuteAlready = await routed.bot.DB.verify('muted-users', {
    active: true,
    id: targetUser.id
  })

  // If they already have one active, let the caller of this command know
  if (hasActiveMuteAlready) {
    await routed.reply(routed.$render('Moderate.Mute.AlreadyMuted'))
    return true
  }

  // Does user have a role above Kiera?
  const untouchableRoles = [...targetUser.roles.cache.values()].filter((r) => {
    return r.position >= kieraInGuild.roles.highest.position || r.name === 'Nitro Booster'
  })
  const hasUntouchableRoles = untouchableRoles.length > 0

  if (hasUntouchableRoles) {
    // Let user calling this command know that there's roles that cannot be removed due to those roles
    // holding the same or higher position than Kiera or the Nitro Booster role which is Discord managed
    await routed.reply(routed.$render('Moderate.Mute.RolesUnableToManage', { untouchableRoles: untouchableRoles.join(', ') }))
  }

  // Now assign the user the mute role removing all previous as well
  // Remove the conflicting roles from the collection being updated
  const rolesToRemove = hasUntouchableRoles
    ? [...targetUser.roles.cache.filter((r) => untouchableRoles.findIndex((rr) => rr.id === r.id) === -1).values()]
    : [...targetUser.roles.cache.values()]
  // Remove @everyone as this is unmanagable
  rolesToRemove.splice(
    rolesToRemove.findIndex((rr) => rr.name === '@everyone'),
    1
  )

  // Ask for a reason to record
  const reason = await Utils.promptUserInput(routed, {
    // deleteFirstMessageAtEnd: true,
    // deleteResponseAtEnd: true,
    firstMessage: routed.$render('Moderate.Mute.ReasonForMutePrompt')
  })

  // Merge all reason input text
  const reasonCombined = reason.map((r) => r.cleanContent).join('\n')

  // Ask for how long to apply this mute
  const muteLength = await Utils.promptUserInput(routed, {
    firstMessage: routed.$render('Moderate.Mute.LengthForMutePrompt'),
    maxToCollect: 1
  })
  const muteLenthString = muteLength.first().cleanContent
  const muteLengthIsNumber = Number.isInteger(parseInt(muteLenthString))

  // Confirm action before proceeding
  const confirmed = await Utils.promptUserConfirm(routed, {
    deleteFirstMessageAtEnd: true,
    deleteResponseAtEnd: true,
    expectedValidCancel: 'no',
    expectedValidResponse: 'yes',
    firstMessage: routed.$render('Moderate.Mute.ConfirmMutePrompt'),
    onTimeoutErrorMessage: routed.$render('Moderate.Mute.CancelledMute')
  })

  if (!confirmed) {
    await routed.reply(routed.$render('Moderate.Mute.CancelledMute'))
    return true // Stop here
  }

  try {
    await targetUser.roles.remove(rolesToRemove.map((r) => r.id))
    await targetUser.roles.add(muteRole)
  } catch (error) {
    await routed.reply(routed.$render('Generic.Error.Internal'))
    console.log(`Mod:Mute => Failed to make mute changes`, error)
  }

  const mutedUserRecord = new TrackedMutedUser({
    discriminator: targetUser.user.discriminator,
    id: targetUser.id,
    mutedByDiscriminator: routed.author.discriminator,
    mutedById: routed.author.id,
    mutedByUsername: routed.author.username,
    nickname: targetUser.nickname,
    reason: routed.v.o.reason || reasonCombined || '<blank>',
    removeAt: muteLengthIsNumber ? Date.now() + parseFloat(muteLenthString) * 3600000 : undefined,
    roles: rolesToRemove.map((r) => {
      return {
        id: r.id,
        name: r.name
      }
    }),
    serverID: routed.message.guild.id,
    username: targetUser.user.username
  })

  // Store a record of the muted user's info into Kiera's DB for later if/when unmuted to return roles
  await routed.bot.DB.add('muted-users', mutedUserRecord)

  // Reponse to command caller
  await routed.message.channel.send(
    routed.$render('Moderate.Mute.New', {
      discriminator: targetUser.user.discriminator,
      id: targetUser.id,
      mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`,
      reason: mutedUserRecord.reason,
      removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
      rolesPreserved: mutedUserRecord.roles.map((r) => r.name).join(' '),
      username: targetUser.user.username
    })
  )
  return true
}

export async function unMute(routed: RouterRouted) {
  const muteRole = routed.message.guild.roles.cache.find((r) => r.name === 'Temporary Mute')
  const targetUser = await routed.message.guild.members
    .fetch(routed.v.o.user)
    .then((u) => u)
    .catch((e) => null)

  // Could not find user
  if (!targetUser) {
    await routed.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  // Query user's Mute record in Kiera's DB
  const mutedUserRecord = new TrackedMutedUser(
    await routed.bot.DB.get('muted-users', {
      active: true,
      id: targetUser.id
    })
  )

  if (!mutedUserRecord._id) {
    await routed.reply(routed.$render('Moderate.Error.CouldNotFindActiveMuteForUser'))
    return true
  }

  // Update Mute record
  await routed.bot.DB.update(
    'muted-users',
    {
      active: true,
      id: mutedUserRecord.id
    },
    {
      $set: {
        active: false,
        removedAt: Date.now(),
        removedBy: routed.author.id
      }
    },
    { atomic: true }
  )

  // Now remove the user's mute role adding back all previous roles
  await targetUser.roles.remove(muteRole)
  await targetUser.roles.add(mutedUserRecord.roles.map((r) => r.id))

  await routed.message.channel.send(
    targetUser
      ? routed.$render('Moderate.Unmute.EntryUnmute', {
          dateFormatted: new Date(mutedUserRecord.timestamp).toUTCString(),
          discriminator: targetUser.user.discriminator,
          id: targetUser.id,
          mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`,
          reason: mutedUserRecord.reason,
          removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
          removedAt: new Date(Date.now()).toUTCString(),
          rolesRestored: mutedUserRecord.roles.map((r) => r.name).join(' '),
          username: targetUser.user.username
        })
      : routed.$render('Moderate.Unmute.EntryUnmute', {
          dateFormatted: new Date(mutedUserRecord.timestamp).toUTCString(),
          discriminator: mutedUserRecord.discriminator,
          id: mutedUserRecord.id,
          mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`,
          reason: mutedUserRecord.reason,
          removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
          removedAt: new Date(Date.now()).toUTCString(),
          username: mutedUserRecord.username
        })
  )

  return true
}

export async function activeMutes(routed: RouterRouted) {
  const mutedRecordsRaw = await routed.bot.DB.getMultiple('muted-users', {
    active: true,
    serverID: routed.message.guild.id
  })
  const mutedRecords = mutedRecordsRaw.map((m) => new TrackedMutedUser(m))

  let response = ``
  response += routed.$render('Moderate.Mute.ListLookup')
  response += '```'

  for (let index = 0; index < mutedRecords.length; index++) {
    const m = mutedRecords[index]
    let userOnServer: GuildMember
    try {
      await routed.message.guild.members.fetch(m.id)
    } catch (error) {
      userOnServer = undefined
    }

    // If still on the server
    if (userOnServer) {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        dateFormatted: new Date(m.timestamp).toUTCString(),
        discriminator: userOnServer.user.discriminator,
        id: m.id,
        mutedBy: `${m.mutedByUsername}#${m.mutedByDiscriminator}`,
        reason: m.reason,
        removeAt: new Date(m.removeAt).toUTCString(),
        username: userOnServer.user.username
      })
    } else {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        dateFormatted: new Date(m.timestamp).toUTCString(),
        discriminator: m.discriminator,
        id: m.id,
        mutedBy: `${m.mutedByUsername}#${m.mutedByDiscriminator}`,
        reason: m.reason,
        removeAt: new Date(m.removeAt).toUTCString(),
        username: m.username
      })
    }
  }

  response += '```'

  await routed.reply(response)
}

export async function lookupMutes(routed: RouterRouted) {
  const targetUser = await routed.message.guild.members.fetch(routed.v.o.user)
  const mutedRecordsRaw = await routed.bot.DB.getMultiple('muted-users', {
    id: targetUser.id,
    serverID: routed.message.guild.id
  })

  // Could not find user
  if (!mutedRecordsRaw) {
    await routed.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  const mutedRecords = mutedRecordsRaw.map((m) => new TrackedMutedUser(m))

  let response = ``
  response += routed.$render('Moderate.Mute.EntryLookup')
  response += '```'
  mutedRecords.forEach((m) => {
    // If still on the server
    if (targetUser) {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        dateFormatted: new Date(m.timestamp).toUTCString(),
        discriminator: targetUser.user.discriminator,
        id: m.id,
        mutedBy: `@${m.mutedByUsername}#${m.mutedByDiscriminator}`,
        reason: m.reason,
        removeAt: new Date(m.removeAt).toUTCString(),
        username: targetUser.user.username
      })
    } else {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        dateFormatted: new Date(m.timestamp).toUTCString(),
        discriminator: m.discriminator,
        id: m.id,
        mutedBy: `@${m.mutedByUsername}#${m.mutedByDiscriminator}`,
        reason: m.reason,
        removeAt: new Date(m.removeAt).toUTCString(),
        username: m.username
      })
    }
  })
  response += '```'

  await routed.reply(response)
}
