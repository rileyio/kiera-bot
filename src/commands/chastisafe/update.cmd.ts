/* eslint-disable sort-keys */
import { AcceptedResponse, Routed } from '#router/index'
import { EmbedBuilder, GuildMember, Role } from 'discord.js'

import { performance } from 'perf_hooks'

export async function update(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const updatePerformance = {
    full: { start: performance.now(), end: 0 },
    verify: { start: 0, end: 0 },
    lockee: { start: 0, end: 0 },
    locktober: { start: 0, end: 0 },
    keyholder: { start: 0, end: 0 },
    nickname: { start: 0, end: 0 }
  }

  // Check if username was specified from slash commands or from legacy command
  const mentionedUser = routed.interaction.options.getMentionable('user') as GuildMember

  // Fetch all that have been mapped already
  const alreadyMapped = await routed.bot.DB.getMultiple('server-settings', {
    key: /^server\.cs\.roles/,
    serverID: routed.guild.id
  })

  // Already Mapped as Object
  const alreadyMappedIDs = {
    // Lockee
    noviceLockeeX: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.1`),
    noviceLockeeY: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.11`),
    noviceLockeeZ: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.111`),
    intermediateLockeeX: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.2`),
    intermediateLockeeY: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.22`),
    intermediateLockeeZ: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.222`),
    experiencedLockeeX: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.3`),
    experiencedLockeeY: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.33`),
    experiencedLockeeZ: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.333`),
    devotedLockeeX: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.4`),
    devotedLockeeY: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.44`),
    devotedLockeeZ: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.444`),
    fanaticalLockeeX: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.5`),
    fanaticalLockeeY: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.55`),
    fanaticalLockeeZ: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.555`),
    // Keyholder
    noviceKeyholder: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.101`),
    keyholder: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.102`),
    establishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.103`),
    distinguishedKeyholder: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.104`),
    renownedKeyholder: alreadyMapped.find((saved) => saved.key === `server.cs.roles.exp.105`),
    // Specials
    unlocked: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.1`),
    locked: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.2`),
    // locktober2019: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.3`),
    // locktober2020: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.4`),
    // locktober2021: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.5`),
    locktoberOngoing: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.6`),
    locktober2022: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.7`),
    locktober2023: alreadyMapped.find((saved) => saved.key === `server.cs.roles.special.8`)
  }

  // Track changes made later - if any
  const changesImplemented: Array<any> = []

  /// ? /////////////////////////////////////
  /// ? Collect User Data for update      ///
  /// ? /////////////////////////////////////

  // * Performance Start: Lockee * //
  updatePerformance.lockee.start = performance.now()
  changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Lockee' })

  // Fetch User Profile from CS
  const { data, successful } = await routed.bot.Service.ChastiSafe.fetchProfile(mentionedUser ? mentionedUser.id : routed.author.id)

  // If there's an error, inform the user
  if (successful === false) return await routed.reply({ content: 'ChastiSafe user not found', ephemeral: true })

  // console.log('csUser', csUser)

  // Find if any locked locks
  const hasLockedLock = data.isChastityLocked

  // Fetch some stuff from Discord & ChastiSafe
  const discordUser = !mentionedUser
    ? await routed.guild.members.fetch(mentionedUser ? mentionedUser.id : routed.author.id)
    : // User calling the commands
      routed.member

  // Ensure user can actually be found (Has not left, or not some other error)
  if (!discordUser) return // Stop here

  // Server Roles
  const role: { [name: string]: Role } = {
    locked: undefined,
    unlocked: undefined,
    locktober2019: undefined,
    locktober2020: undefined,
    locktober2021: undefined,
    locktober2022: undefined,
    locktober2023: undefined,
    locktoberOngoing: undefined,
    renownedKeyholder: undefined,
    distinguishedKeyholder: undefined,
    establishedKeyholder: undefined,
    keyholder: undefined,
    noviceKeyholder: undefined,
    fanaticalLockeeX: undefined,
    devotedLockeeX: undefined,
    experiencedLockeeX: undefined,
    intermediateLockeeX: undefined,
    noviceLockeeX: undefined,
    fanaticalLockeeY: undefined,
    devotedLockeeY: undefined,
    experiencedLockeeY: undefined,
    intermediateLockeeY: undefined,
    noviceLockeeY: undefined,
    fanaticalLockeeZ: undefined,
    devotedLockeeZ: undefined,
    experiencedLockeeZ: undefined,
    intermediateLockeeZ: undefined,
    noviceLockeeZ: undefined
  }

  // User Roles
  const discordUserHasRole = {
    locked: false,
    unlocked: false,
    locktober2019: false,
    locktober2020: false,
    locktober2021: false,
    locktober2022: false,
    locktober2023: false,
    locktoberOngoing: false,
    renownedKeyholder: false,
    distinguishedKeyholder: false,
    establishedKeyholder: false,
    keyholder: false,
    noviceKeyholder: false,
    fanaticalLockeeX: false,
    devotedLockeeX: false,
    experiencedLockeeX: false,
    intermediateLockeeX: false,
    noviceLockeeX: false,
    fanaticalLockeeY: false,
    devotedLockeeY: false,
    experiencedLockeeY: false,
    intermediateLockeeY: false,
    noviceLockeeY: false,
    fanaticalLockeeZ: false,
    devotedLockeeZ: false,
    experiencedLockeeZ: false,
    intermediateLockeeZ: false,
    noviceLockeeZ: false
  }

  // Loop once finding roles for the above variables
  routed.guild.roles.cache.forEach((r) => {
    if (alreadyMappedIDs.unlocked) if (r.id === alreadyMappedIDs.unlocked.value) role.unlocked = r
    if (alreadyMappedIDs.locked) if (r.id === alreadyMappedIDs.locked.value) role.locked = r
    // if (alreadyMappedIDs.locktober2019) if (r.id === alreadyMappedIDs.locktober2019.value) role.locktober2019 = r
    // if (alreadyMappedIDs.locktober2020) if (r.id === alreadyMappedIDs.locktober2020.value) role.locktober2020 = r
    // if (alreadyMappedIDs.locktober2021) if (r.id === alreadyMappedIDs.locktober2021.value) role.locktober2021 = r
    if (alreadyMappedIDs.locktoberOngoing) if (r.id === alreadyMappedIDs.locktoberOngoing.value) role.locktoberOngoing = r
    if (alreadyMappedIDs.locktober2022) if (r.id === alreadyMappedIDs.locktober2022.value) role.locktober2022 = r
    if (alreadyMappedIDs.locktober2023) if (r.id === alreadyMappedIDs.locktober2023.value) role.locktober2023 = r
    // Keyholder
    if (alreadyMappedIDs.renownedKeyholder) if (r.id === alreadyMappedIDs.renownedKeyholder.value) role.renownedKeyholder = r
    if (alreadyMappedIDs.distinguishedKeyholder) if (r.id === alreadyMappedIDs.distinguishedKeyholder.value) role.distinguishedKeyholder = r
    if (alreadyMappedIDs.establishedKeyholder) if (r.id === alreadyMappedIDs.establishedKeyholder.value) role.establishedKeyholder = r
    if (alreadyMappedIDs.keyholder) if (r.id === alreadyMappedIDs.keyholder.value) role.keyholder = r
    if (alreadyMappedIDs.noviceKeyholder) if (r.id === alreadyMappedIDs.noviceKeyholder.value) role.noviceKeyholder = r
    // Lockee
    if (alreadyMappedIDs.fanaticalLockeeX) if (r.id === alreadyMappedIDs.fanaticalLockeeX.value) role.fanaticalLockeeX = r
    if (alreadyMappedIDs.fanaticalLockeeY) if (r.id === alreadyMappedIDs.fanaticalLockeeY.value) role.fanaticalLockeeY = r
    if (alreadyMappedIDs.fanaticalLockeeZ) if (r.id === alreadyMappedIDs.fanaticalLockeeZ.value) role.fanaticalLockeeZ = r
    if (alreadyMappedIDs.devotedLockeeX) if (r.id === alreadyMappedIDs.devotedLockeeX.value) role.devotedLockeeX = r
    if (alreadyMappedIDs.devotedLockeeY) if (r.id === alreadyMappedIDs.devotedLockeeY.value) role.devotedLockeeY = r
    if (alreadyMappedIDs.devotedLockeeZ) if (r.id === alreadyMappedIDs.devotedLockeeZ.value) role.devotedLockeeZ = r
    if (alreadyMappedIDs.experiencedLockeeX) if (r.id === alreadyMappedIDs.experiencedLockeeX.value) role.experiencedLockeeX = r
    if (alreadyMappedIDs.experiencedLockeeY) if (r.id === alreadyMappedIDs.experiencedLockeeY.value) role.experiencedLockeeY = r
    if (alreadyMappedIDs.experiencedLockeeZ) if (r.id === alreadyMappedIDs.experiencedLockeeZ.value) role.experiencedLockeeZ = r
    if (alreadyMappedIDs.intermediateLockeeX) if (r.id === alreadyMappedIDs.intermediateLockeeX.value) role.intermediateLockeeX = r
    if (alreadyMappedIDs.intermediateLockeeY) if (r.id === alreadyMappedIDs.intermediateLockeeY.value) role.intermediateLockeeY = r
    if (alreadyMappedIDs.intermediateLockeeZ) if (r.id === alreadyMappedIDs.intermediateLockeeZ.value) role.intermediateLockeeZ = r
    if (alreadyMappedIDs.noviceLockeeX) if (r.id === alreadyMappedIDs.noviceLockeeX.value) role.noviceLockeeX = r
    if (alreadyMappedIDs.noviceLockeeY) if (r.id === alreadyMappedIDs.noviceLockeeY.value) role.noviceLockeeY = r
    if (alreadyMappedIDs.noviceLockeeZ) if (r.id === alreadyMappedIDs.noviceLockeeZ.value) role.noviceLockeeZ = r
  })

  // ... Now for user
  discordUser.roles.cache.forEach((r) => {
    if (alreadyMappedIDs.unlocked) if (r.id === alreadyMappedIDs.unlocked.value) discordUserHasRole.unlocked = true
    if (alreadyMappedIDs.locked) if (r.id === alreadyMappedIDs.locked.value) discordUserHasRole.locked = true
    // if (alreadyMappedIDs.locktober2019) if (r.id === alreadyMappedIDs.locktober2019.value) discordUserHasRole.locktober2019 = true
    // if (alreadyMappedIDs.locktober2020) if (r.id === alreadyMappedIDs.locktober2020.value) discordUserHasRole.locktober2020 = true
    // if (alreadyMappedIDs.locktober2021) if (r.id === alreadyMappedIDs.locktober2021.value) discordUserHasRole.locktober2021 = true
    if (alreadyMappedIDs.locktoberOngoing) if (r.id === alreadyMappedIDs.locktoberOngoing.value) discordUserHasRole.locktoberOngoing = true
    if (alreadyMappedIDs.locktober2022) if (r.id === alreadyMappedIDs.locktober2022.value) discordUserHasRole.locktober2022 = true
    if (alreadyMappedIDs.locktober2023) if (r.id === alreadyMappedIDs.locktober2023.value) discordUserHasRole.locktober2023 = true
    // Keyholder
    if (alreadyMappedIDs.renownedKeyholder) if (r.id === alreadyMappedIDs.renownedKeyholder.value) discordUserHasRole.renownedKeyholder = true
    if (alreadyMappedIDs.distinguishedKeyholder) if (r.id === alreadyMappedIDs.distinguishedKeyholder.value) discordUserHasRole.distinguishedKeyholder = true
    if (alreadyMappedIDs.establishedKeyholder) if (r.id === alreadyMappedIDs.establishedKeyholder.value) discordUserHasRole.establishedKeyholder = true
    if (alreadyMappedIDs.keyholder) if (r.id === alreadyMappedIDs.keyholder.value) discordUserHasRole.keyholder = true
    if (alreadyMappedIDs.noviceKeyholder) if (r.id === alreadyMappedIDs.noviceKeyholder.value) discordUserHasRole.noviceKeyholder = true
    // Lockee
    if (alreadyMappedIDs.fanaticalLockeeX) if (r.id === alreadyMappedIDs.fanaticalLockeeX.value) discordUserHasRole.fanaticalLockeeX = true
    if (alreadyMappedIDs.fanaticalLockeeY) if (r.id === alreadyMappedIDs.fanaticalLockeeY.value) discordUserHasRole.fanaticalLockeeY = true
    if (alreadyMappedIDs.fanaticalLockeeZ) if (r.id === alreadyMappedIDs.fanaticalLockeeZ.value) discordUserHasRole.fanaticalLockeeZ = true
    if (alreadyMappedIDs.devotedLockeeX) if (r.id === alreadyMappedIDs.devotedLockeeX.value) discordUserHasRole.devotedLockeeX = true
    if (alreadyMappedIDs.devotedLockeeY) if (r.id === alreadyMappedIDs.devotedLockeeY.value) discordUserHasRole.devotedLockeeY = true
    if (alreadyMappedIDs.devotedLockeeZ) if (r.id === alreadyMappedIDs.devotedLockeeZ.value) discordUserHasRole.devotedLockeeZ = true
    if (alreadyMappedIDs.experiencedLockeeX) if (r.id === alreadyMappedIDs.experiencedLockeeX.value) discordUserHasRole.experiencedLockeeX = true
    if (alreadyMappedIDs.experiencedLockeeY) if (r.id === alreadyMappedIDs.experiencedLockeeY.value) discordUserHasRole.experiencedLockeeY = true
    if (alreadyMappedIDs.experiencedLockeeZ) if (r.id === alreadyMappedIDs.experiencedLockeeZ.value) discordUserHasRole.experiencedLockeeZ = true
    if (alreadyMappedIDs.intermediateLockeeX) if (r.id === alreadyMappedIDs.intermediateLockeeX.value) discordUserHasRole.intermediateLockeeX = true
    if (alreadyMappedIDs.intermediateLockeeY) if (r.id === alreadyMappedIDs.intermediateLockeeY.value) discordUserHasRole.intermediateLockeeY = true
    if (alreadyMappedIDs.intermediateLockeeZ) if (r.id === alreadyMappedIDs.intermediateLockeeZ.value) discordUserHasRole.intermediateLockeeZ = true
    if (alreadyMappedIDs.noviceLockeeX) if (r.id === alreadyMappedIDs.noviceLockeeX.value) discordUserHasRole.noviceLockeeX = true
    if (alreadyMappedIDs.noviceLockeeY) if (r.id === alreadyMappedIDs.noviceLockeeY.value) discordUserHasRole.noviceLockeeY = true
    if (alreadyMappedIDs.noviceLockeeZ) if (r.id === alreadyMappedIDs.noviceLockeeZ.value) discordUserHasRole.noviceLockeeZ = true
  })

  // Determine which color the user prefers, Y or X
  let userHasPref = false
  // let isChangingLockeeExpRole = false
  const prefX =
    discordUserHasRole.fanaticalLockeeX ||
    discordUserHasRole.devotedLockeeX ||
    discordUserHasRole.experiencedLockeeX ||
    discordUserHasRole.intermediateLockeeX ||
    discordUserHasRole.noviceLockeeX
  const prefY =
    discordUserHasRole.fanaticalLockeeY ||
    discordUserHasRole.devotedLockeeY ||
    discordUserHasRole.experiencedLockeeY ||
    discordUserHasRole.intermediateLockeeY ||
    discordUserHasRole.noviceLockeeY
  const prefZ =
    discordUserHasRole.fanaticalLockeeZ ||
    discordUserHasRole.devotedLockeeZ ||
    discordUserHasRole.experiencedLockeeZ ||
    discordUserHasRole.intermediateLockeeZ ||
    discordUserHasRole.noviceLockeeZ

  // Ensure user has a color preference already selected, otherwise don't pick one
  if (prefY || prefX || prefZ) userHasPref = true

  // Cumulative time locked
  // const cumulativeTimeLockedMonths = Math.round((data.cumulativeSecondsLocked / 2592000) * 100) / 100

  /// ? ////////////////////////////////////
  /// ? Role Update: Locked || Unlocked  ///
  /// ? ////////////////////////////////////
  try {
    if (role.unlocked || role.locked) {
      if (userHasPref || discordUserHasRole.unlocked || discordUserHasRole.locked) {
        // When there are locks Locked or not yet unlocked: set the locked role
        if (hasLockedLock) {
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
    }
  } catch (e) {
    console.log('CS Update Error updating Locked/Unlocked role')
  }

  /// ? ////////////////////////////////////
  /// ? Role Update: Experience Level    ///
  /// ? ////////////////////////////////////
  // Fanatical    = 24
  // Devoted      = 12
  // Experienced  =  6
  // Intermediate =  2
  // Novice       =  0

  try {
    const rolesToRemove = [] as Array<{ role: string }>

    // Devoted
    if (data.highestLockeeLevel === 'Fanatical' && userHasPref) {
      // Add Proper Fanatical role
      if (!discordUserHasRole.fanaticalLockeeX && prefX) {
        await discordUser.roles.add(role.fanaticalLockeeX)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.fanaticalLockeeX.name })
      }
      if (!discordUserHasRole.fanaticalLockeeY && prefY) {
        await discordUser.roles.add(role.fanaticalLockeeY)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.fanaticalLockeeY.name })
      }
      if (!discordUserHasRole.fanaticalLockeeZ && prefZ) {
        await discordUser.roles.add(role.fanaticalLockeeZ)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.fanaticalLockeeZ.name })
      }

      // Remove other roles
      rolesToRemove.push(
        { role: 'devotedLockeeX' },
        { role: 'devotedLockeeY' },
        { role: 'devotedLockeeZ' },
        { role: 'experiencedLockeeX' },
        { role: 'experiencedLockeeY' },
        { role: 'experiencedLockeeZ' },
        { role: 'intermediateLockeeX' },
        { role: 'intermediateLockeeY' },
        { role: 'intermediateLockeeZ' },
        { role: 'noviceLockeeX' },
        { role: 'noviceLockeeY' },
        { role: 'noviceLockeeZ' }
      )
    }

    // Devoted
    if (data.highestLockeeLevel === 'Devoted' && userHasPref) {
      // Add Proper Devoted role
      if (!discordUserHasRole.devotedLockeeX && prefX) {
        await discordUser.roles.add(role.devotedLockeeX)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.devotedLockeeX.name })
      }
      if (!discordUserHasRole.devotedLockeeY && prefY) {
        await discordUser.roles.add(role.devotedLockeeY)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.devotedLockeeY.name })
      }
      if (!discordUserHasRole.devotedLockeeZ && prefZ) {
        await discordUser.roles.add(role.devotedLockeeZ)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.devotedLockeeZ.name })
      }

      // Remove other roles
      rolesToRemove.push(
        { role: 'fanaticalLockeeX' },
        { role: 'fanaticalLockeeY' },
        { role: 'fanaticalLockeeZ' },
        { role: 'experiencedLockeeX' },
        { role: 'experiencedLockeeY' },
        { role: 'experiencedLockeeZ' },
        { role: 'intermediateLockeeX' },
        { role: 'intermediateLockeeY' },
        { role: 'intermediateLockeeZ' },
        { role: 'noviceLockeeX' },
        { role: 'noviceLockeeY' },
        { role: 'noviceLockeeZ' }
      )
    }

    // Experienced
    if (data.highestLockeeLevel === 'Experienced' && userHasPref) {
      // Add Proper Experienced role
      if (!discordUserHasRole.experiencedLockeeX && prefX) {
        await discordUser.roles.add(role.experiencedLockeeX)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.experiencedLockeeX.name })
      }
      if (!discordUserHasRole.experiencedLockeeY && prefY) {
        await discordUser.roles.add(role.experiencedLockeeY)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.experiencedLockeeY.name })
      }
      if (!discordUserHasRole.experiencedLockeeZ && prefZ) {
        await discordUser.roles.add(role.experiencedLockeeZ)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.experiencedLockeeZ.name })
      }

      // Remove other roles
      rolesToRemove.push(
        { role: 'fanaticalLockeeX' },
        { role: 'fanaticalLockeeY' },
        { role: 'fanaticalLockeeZ' },
        { role: 'devotedLockeeX' },
        { role: 'devotedLockeeY' },
        { role: 'devotedLockeeZ' },
        { role: 'intermediateLockeeX' },
        { role: 'intermediateLockeeY' },
        { role: 'intermediateLockeeZ' },
        { role: 'noviceLockeeX' },
        { role: 'noviceLockeeY' },
        { role: 'noviceLockeeZ' }
      )
    }

    // Intermediate
    if (data.highestLockeeLevel === 'Intermediate' && userHasPref) {
      // Add Proper Intermediate role
      if (!discordUserHasRole.intermediateLockeeX && prefX) {
        await discordUser.roles.add(role.intermediateLockeeX)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.intermediateLockeeX.name })
      }
      if (!discordUserHasRole.intermediateLockeeY && prefY) {
        await discordUser.roles.add(role.intermediateLockeeY)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.intermediateLockeeY.name })
      }
      if (!discordUserHasRole.intermediateLockeeZ && prefZ) {
        await discordUser.roles.add(role.intermediateLockeeZ)
        changesImplemented.push({ action: 'added', category: 'lockee', type: 'role', result: role.intermediateLockeeZ.name })
      }

      // Remove other roles
      rolesToRemove.push(
        { role: 'fanaticalLockeeX' },
        { role: 'fanaticalLockeeY' },
        { role: 'fanaticalLockeeZ' },
        { role: 'devotedLockeeX' },
        { role: 'devotedLockeeY' },
        { role: 'devotedLockeeZ' },
        { role: 'experiencedLockeeX' },
        { role: 'experiencedLockeeY' },
        { role: 'experiencedLockeeZ' },
        { role: 'noviceLockeeX' },
        { role: 'noviceLockeeY' },
        { role: 'noviceLockeeZ' }
      )
    }

    // Removal Step
    for (let index = 0; index < rolesToRemove.length; index++) {
      const roleForRemoval = rolesToRemove[index]
      // Check to be sure all are mapped before trying to process, to prevent any error
      // console.log('checking role for removal', roleForRemoval.role, role[roleForRemoval.role])
      if (role[roleForRemoval.role]) {
        // Ensure user has role before attempting to remove
        if (discordUserHasRole[roleForRemoval.role]) {
          console.log('--> Removing Role:', role[roleForRemoval.role].name, 'From:', discordUser.id)
          await discordUser.roles.remove(role[roleForRemoval.role])
          changesImplemented.push({ action: 'removed', category: 'lockee', type: 'role', result: role[roleForRemoval.role].name })
        }
      } // else console.log('## Role has not been mapped', roleForRemoval)
    }
  } catch (e) {
    console.log('CK Update Error updating Experience role', e)
  }
  // * Performance End: Lockee * //
  updatePerformance.lockee.end = performance.now()
  changesImplemented.push({ action: 'performance', category: 'n/a', type: 'status', result: Math.round(updatePerformance.lockee.end - updatePerformance.lockee.start) })

  /// ? ////////////////////////////////////
  /// ? Role Update: Locktober           ///
  /// ? ////////////////////////////////////
  try {
    if (role.locktoberOngoing || role.locktober2022 || role.locktober2023) {
      // * Performance Start: Locktober * //
      updatePerformance.locktober.start = performance.now()
      changesImplemented.push({ action: 'header', category: 'n/a', type: 'status', result: 'Locktober' })

      const isLocktoberParticipant = data.isLocktoberOngoingEligible
      const isLocktober2022Eligible = data.isLocktober2022Eligible
      const isLocktober2023Eligible = data.isLocktober2023Eligible

      // * Participant * //
      if (isLocktoberParticipant) {
        // User is a participant (so far), is missing the role, add the role
        if (!discordUserHasRole.locktoberOngoing) {
          await discordUser.roles.add(role.locktoberOngoing)
          changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: role.locktoberOngoing.name })
        }
      }
      // Else: User is not longer participating, remove the role
      else {
        // User is NOT found participating, remove the role
        if (discordUserHasRole.locktoberOngoing) {
          await discordUser.roles.remove(role.locktoberOngoing)
          changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: role.locktoberOngoing.name })
        }
      }

      if (isLocktober2022Eligible || isLocktober2023Eligible) {
        // * 2022 * //
        // User has earned Locktober 2022, is missing the role, add the role
        if (!discordUserHasRole.locktober2022 && isLocktober2022Eligible) {
          await discordUser.roles.add(role.locktober2022)
          changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: role.locktober2022.name })
        }
        // * 2023 * //
        if (isLocktober2023Eligible && isLocktober2023Eligible) {
          // User has earned Locktober 2022, is missing the role, add the role
          if (!discordUserHasRole.locktober2023) {
            await discordUser.roles.add(role.locktober2023)
            changesImplemented.push({ action: 'added', category: 'locktober', type: 'role', result: role.locktober2023.name })
          }
        }
      }
      // Else: remove the role, they should not have it
      else {
        // User is NOT found participating or was assigned it manually, remove the role
        if (discordUserHasRole.locktober2022 && !isLocktober2022Eligible) {
          await discordUser.roles.remove(role.locktober2022)
          changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: role.locktober2022.name })
        }
        if (discordUserHasRole.locktober2023 && !isLocktober2023Eligible) {
          await discordUser.roles.remove(role.locktober2023)
          changesImplemented.push({ action: 'removed', category: 'locktober', type: 'role', result: role.locktober2023.name })
        }
      }
    }
  } catch (e) {
    console.log('CS Update Error updating Locktober role(s)', e)
  }

  // * Performance End: Locktober * //
  updatePerformance.locktober.end = performance.now()
  changesImplemented.push({
    action: 'performance',
    category: 'n/a',
    type: 'status',
    result: Math.round(updatePerformance.locktober.end - updatePerformance.locktober.start)
  })

  // * Performance End: Full * //
  updatePerformance.full.end = performance.now()
  changesImplemented.push({ action: 'performance-overall', category: 'n/a', type: 'status', result: Math.round(updatePerformance.full.end - updatePerformance.full.start) })

  const lockeeUpdates = changesImplemented.filter((u) => u.category === 'lockee' && u.action !== 'header' && u.action !== 'performance')
  const keyholderUpdates = changesImplemented.find((u) => u.category === 'keyholder' && u.action !== 'header' && u.action !== 'performance')
  const nicknameUpdates = changesImplemented.find((u) => u.category === 'nickname' && u.action !== 'header' && u.action !== 'performance')
  const eventUpdates = changesImplemented.filter((u) => u.category === 'locktober' && u.action !== 'header' && u.action !== 'performance')
  const overallPerformance = changesImplemented.find((u) => u.action === 'performance-overall')

  return await routed.reply(
    {
      embeds: [
        new EmbedBuilder()
          .setColor(9125611)
          .setTitle(`Summary of changes to \`@${discordUser.nickname || discordUser.user.username + '#' + discordUser.user.discriminator}\``)
          .setDescription(
            'The following changes are managed by Kiera. Modifying any of these manually may result in Kiera overriding later when the `update` command is called again.'
          )
          .setFields([
            lockeeUpdates.length
              ? {
                  inline: false,
                  name: 'Lockee Status Roles',
                  value: lockeeUpdates
                    .map((status) => (status ? `${status.action === 'added' || status.action === 'changed' ? '✅ ' : '❌ '}${status.result}` : '✅ No changes'))
                    .join('\n')
                }
              : {
                  inline: false,
                  name: 'Lockee Status Roles',
                  value: '✅ No changes'
                },
            {
              inline: false,
              name: 'Keyholder Status Roles',
              value: keyholderUpdates
                ? `${keyholderUpdates.action === 'added' || keyholderUpdates.action === 'changed' ? '✅ ' : '❌ '}${keyholderUpdates.result}`
                : '✅ No changes'
            },
            {
              inline: false,
              name: 'Nickname Management',
              value: nicknameUpdates ? `${nicknameUpdates.successful === false ? '✅ Updated to ' : '❌ '}\`${nicknameUpdates.result}\`` : '✅ No changes'
            }, // Events
            eventUpdates.length
              ? {
                  inline: false,
                  name: 'Events',
                  value: eventUpdates.map((event) => `${event.action === 'added' || event.action === 'changed' ? '✅ ' : '❌ '}${event.result}`).join(', ')
                }
              : {
                  inline: false,
                  name: 'Events',
                  value: '✅ No changes'
                }
          ])
          .setFooter({
            iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
            text: `Processing time: ${overallPerformance.result}ms`
          })
          .setThumbnail(`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.user.avatar}`)
          .setTimestamp(Date.now())
      ]
    },
    true
  )
  // } catch (e) {
  //   if (e.code === 50013) {
  //     return await routed.reply(
  //       {
  //         embeds: [
  //           new EmbedBuilder()
  //             .setColor(15548997)
  //             .setTitle('Bot Missing Permission')
  //             .setDescription('Ensure that the bot has the `Manage Roles` permission and is also above the role you are trying to assign.')
  //             .setFooter({
  //               iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
  //               text: 'Error from Kiera'
  //             })
  //             .setTimestamp(Date.now())
  //         ]
  //       },
  //       true
  //     )
  //   }
  // }
}
