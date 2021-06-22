import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { ExportRoutes, RouterRouted } from '@/router'
import { TrackedMutedUser } from '@/objects/user/'
import { GuildMember } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Moderate',
    controller: mute,
    description: 'Help.Moderate.MuteUser',
    example: '{{prefix}}mod mute 526039977247899649',
    name: 'mod-mute-user',
    validate: '/mod:string/mute:string/user=string/reason?=string',
    middleware: [Middleware.isModerator],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    controller: unMute,
    description: 'Help.Moderate.UnmuteUser',
    example: '{{prefix}}mod unmute 526039977247899649',
    name: 'mod-unmute-user',
    validate: '/mod:string/unmute:string/user=string',
    middleware: [Middleware.isModerator],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    controller: activeMutes,
    description: 'Help.Moderate.MuteListMuted',
    example: '{{prefix}}mod list muted',
    name: 'mod-muted-list',
    validate: '/mod:string/list:string/muted:string',
    middleware: [Middleware.isModerator],
    permissions: {
      serverOnly: true
    }
  },
  {
    type: 'message',
    category: 'Moderate',
    controller: lookupMutes,
    description: 'Help.Moderate.MuteLookup',
    example: '{{prefix}}mod lookup mute 526039977247899649',
    name: 'mod-mute-lookup-list',
    validate: '/mod:string/lookup:string/mute:string/user=string',
    middleware: [Middleware.isModerator],
    permissions: {
      serverOnly: true
    }
  }
)

export async function mute(routed: RouterRouted) {
  const muteRole = routed.message.guild.roles.cache.find((r) => r.name === 'Temporary Mute')
  const kieraInGuild = routed.message.guild.members.cache.get(routed.bot.client.user.id)
  const targetUser = await routed.message.guild.members.fetch(routed.v.o.user)

  // Could not find user
  if (!targetUser) {
    await routed.message.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.message.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  // See if one is already active and stored for this user
  const hasActiveMuteAlready = await routed.bot.DB.verify<TrackedMutedUser>('muted-users', { id: targetUser.id, active: true })

  // If they already have one active, let the caller of this command know
  if (hasActiveMuteAlready) {
    await routed.message.reply(routed.$render('Moderate.Mute.AlreadyMuted'))
    return true
  }

  // Does user have a role above Kiera?
  const untouchableRoles = targetUser.roles.cache.array().filter((r) => {
    return r.position >= kieraInGuild.roles.highest.position || r.name === 'Nitro Booster'
  })
  const hasUntouchableRoles = untouchableRoles.length > 0

  if (hasUntouchableRoles) {
    // Let user calling this command know that there's roles that cannot be removed due to those roles
    // holding the same or higher position than Kiera or the Nitro Booster role which is Discord managed
    await routed.message.reply(routed.$render('Moderate.Mute.RolesUnableToManage', { untouchableRoles: untouchableRoles.join(', ') }))
  }

  // Now assign the user the mute role removing all previous as well
  // Remove the conflicting roles from the collection being updated
  var rolesToRemove = hasUntouchableRoles ? targetUser.roles.cache.filter((r) => untouchableRoles.findIndex((rr) => rr.id === r.id) === -1).array() : targetUser.roles.cache.array()
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
    expectedValidResponse: 'yes',
    expectedValidCancel: 'no',
    deleteFirstMessageAtEnd: true,
    deleteResponseAtEnd: true,
    firstMessage: routed.$render('Moderate.Mute.ConfirmMutePrompt'),
    onTimeoutErrorMessage: routed.$render('Moderate.Mute.CancelledMute')
  })

  if (!confirmed) {
    await routed.message.reply(routed.$render('Moderate.Mute.CancelledMute'))
    return true // Stop here
  }

  try {
    await targetUser.roles.remove(rolesToRemove.map((r) => r.id))
    await targetUser.roles.add(muteRole)
  } catch (error) {
    await routed.message.reply(routed.$render('Generic.Error.Internal'))
    console.log(`Mod:Mute => Failed to make mute changes`, error)
  }

  const mutedUserRecord = new TrackedMutedUser({
    id: targetUser.id,
    username: targetUser.user.username,
    discriminator: targetUser.user.discriminator,
    nickname: targetUser.nickname,
    serverID: routed.message.guild.id,
    reason: routed.v.o.reason || reasonCombined || '<blank>',
    mutedById: routed.author.id,
    mutedByUsername: routed.author.username,
    mutedByDiscriminator: routed.author.discriminator,
    removeAt: muteLengthIsNumber ? Date.now() + parseFloat(muteLenthString) * 3600000 : undefined,
    roles: rolesToRemove.map((r) => {
      return { id: r.id, name: r.name }
    })
  })

  // Store a record of the muted user's info into Kiera's DB for later if/when unmuted to return roles
  await routed.bot.DB.add('muted-users', mutedUserRecord)

  // Reponse to command caller
  await routed.message.channel.send(
    routed.$render('Moderate.Mute.New', {
      id: targetUser.id,
      username: targetUser.user.username,
      discriminator: targetUser.user.discriminator,
      removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
      reason: mutedUserRecord.reason,
      mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`,
      rolesPreserved: mutedUserRecord.roles.map((r) => r.name).join(' ')
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
    await routed.message.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.message.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  // Query user's Mute record in Kiera's DB
  const mutedUserRecord = new TrackedMutedUser(
    await routed.bot.DB.get<TrackedMutedUser>('muted-users', { id: targetUser.id, active: true })
  )

  if (!mutedUserRecord._id) {
    await routed.message.reply(routed.$render('Moderate.Error.CouldNotFindActiveMuteForUser'))
    return true
  }

  // Update Mute record
  await routed.bot.DB.update<TrackedMutedUser>(
    'muted-users',
    { id: mutedUserRecord.id, active: true },
    {
      $set: {
        active: false,
        removedBy: routed.author.id,
        removedAt: Date.now()
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
          id: targetUser.id,
          username: targetUser.user.username,
          discriminator: targetUser.user.discriminator,
          dateFormatted: new Date(mutedUserRecord.timestamp).toUTCString(),
          removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
          removedAt: new Date(Date.now()).toUTCString(),
          reason: mutedUserRecord.reason,
          mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`,
          rolesRestored: mutedUserRecord.roles.map((r) => r.name).join(' ')
        })
      : routed.$render('Moderate.Unmute.EntryUnmute', {
          id: mutedUserRecord.id,
          username: mutedUserRecord.username,
          discriminator: mutedUserRecord.discriminator,
          dateFormatted: new Date(mutedUserRecord.timestamp).toUTCString(),
          removeAt: new Date(mutedUserRecord.removeAt).toUTCString(),
          removedAt: new Date(Date.now()).toUTCString(),
          reason: mutedUserRecord.reason,
          mutedBy: `${mutedUserRecord.mutedByUsername}#${mutedUserRecord.mutedByDiscriminator}`
        })
  )

  return true
}

export async function activeMutes(routed: RouterRouted) {
  const mutedRecordsRaw = await routed.bot.DB.getMultiple<TrackedMutedUser>('muted-users', { serverID: routed.message.guild.id, active: true })
  const mutedRecords = mutedRecordsRaw.map((m) => new TrackedMutedUser(m))

  var response = ``
  response += routed.$render('Moderate.Mute.ListLookup')
  response += '```'

  for (let index = 0; index < mutedRecords.length; index++) {
    const m = mutedRecords[index]
    var userOnServer: GuildMember
    try {
      await routed.message.guild.members.fetch(m.id)
    } catch (error) {
      userOnServer = undefined
    }

    // If still on the server
    if (userOnServer) {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        id: m.id,
        username: userOnServer.user.username,
        discriminator: userOnServer.user.discriminator,
        dateFormatted: new Date(m.timestamp).toUTCString(),
        removeAt: new Date(m.removeAt).toUTCString(),
        reason: m.reason,
        mutedBy: `${m.mutedByUsername}#${m.mutedByDiscriminator}`
      })
    } else {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        id: m.id,
        username: m.username,
        discriminator: m.discriminator,
        dateFormatted: new Date(m.timestamp).toUTCString(),
        removeAt: new Date(m.removeAt).toUTCString(),
        reason: m.reason,
        mutedBy: `${m.mutedByUsername}#${m.mutedByDiscriminator}`
      })
    }
  }

  response += '```'

  await routed.message.reply(response)
}

export async function lookupMutes(routed: RouterRouted) {
  const targetUser = await routed.message.guild.members.fetch(routed.v.o.user)
  const mutedRecordsRaw = await routed.bot.DB.getMultiple<TrackedMutedUser>('muted-users', { serverID: routed.message.guild.id, id: targetUser.id })

  // Could not find user
  if (!mutedRecordsRaw) {
    await routed.message.reply(routed.$render('Moderate.Error.CouldNotFindUserSnowflake'))
    return true
  }

  // Block trying to call upon yourself
  if (targetUser.id === routed.author.id) {
    await routed.message.reply(routed.$render('Moderate.Error.CannotCallCommandOnSelf'))
    return true
  }

  const mutedRecords = mutedRecordsRaw.map((m) => new TrackedMutedUser(m))

  var response = ``
  response += routed.$render('Moderate.Mute.EntryLookup')
  response += '```'
  mutedRecords.forEach((m) => {
    // If still on the server
    if (targetUser) {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        id: m.id,
        username: targetUser.user.username,
        discriminator: targetUser.user.discriminator,
        dateFormatted: new Date(m.timestamp).toUTCString(),
        removeAt: new Date(m.removeAt).toUTCString(),
        reason: m.reason,
        mutedBy: `@${m.mutedByUsername}#${m.mutedByDiscriminator}`
      })
    } else {
      response += routed.$render('Moderate.Mute.ListEntryUser', {
        id: m.id,
        username: m.username,
        discriminator: m.discriminator,
        dateFormatted: new Date(m.timestamp).toUTCString(),
        removeAt: new Date(m.removeAt).toUTCString(),
        reason: m.reason,
        mutedBy: `@${m.mutedByUsername}#${m.mutedByDiscriminator}`
      })
    }
  })
  response += '```'

  await routed.message.reply(response)
}
