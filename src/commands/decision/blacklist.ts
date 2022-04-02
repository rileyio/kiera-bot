import * as Middleware from '@/middleware'

import { ExportRoutes, RouterRouted } from '@/router'

import { ObjectId } from 'bson'
import { TrackedDecision } from '@/objects/decision'
import { User } from 'discord.js'

export const Routes = ExportRoutes(
  {
    category: 'Fun',
    controller: unblacklistUser,
    description: 'Help.Decision.UnblacklistUser.Description',
    example: '{{prefix}}decision "id" unblacklist user "userSnowflake"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-unblacklist-user',
    type: 'message',
    validate: '/decision:string/id=string/unblacklist:string/user:string/user=string'
  },
  {
    category: 'Fun',
    controller: blacklistUser,
    description: 'Help.Decision.BlacklistUser.Description',
    example: '{{prefix}}decision "id" blacklist user "userSnowflake"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-blacklist-user',
    type: 'message',
    validate: '/decision:string/id=string/blacklist:string/user:string/user=string'
  },
  {
    category: 'Fun',
    controller: showUserBlacklist,
    description: 'Help.Decision.ShowUserBlacklist.Description',
    example: '{{prefix}}decision "id" blacklisted users',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-blacklist-show',
    type: 'message',
    validate: '/decision:string/id=string/blacklisted:string/users:string'
  },
  {
    category: 'Fun',
    controller: unwhitelistServer,
    description: 'Help.Decision.UnwhitelistServer.Description',
    example: '{{prefix}}decision "id" unwhitelist server "serverID"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-unwhitelist-server',
    type: 'message',
    validate: '/decision:string/id=string/unwhitelist:string/server:string/serverid=string'
  },
  {
    category: 'Fun',
    controller: whitelistServer,
    description: 'Help.Decision.WhitelistServer.Description',
    example: '{{prefix}}decision "id" whitelist server "serverID"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-whitelist-server',
    type: 'message',
    validate: '/decision:string/id=string/whitelist:string/server:string/serverid=string'
  }
)

export async function blacklistUser(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    // Check if user snowflake passed is valid
    const user: User = await routed.bot.client.users
      .fetch(routed.v.o.user)
      .then((u) => {
        return u
      })
      .catch((e) => {
        return null
      })
    const userExists = !!user

    // When user does not exist stop here and notify user
    if (!userExists) {
      await routed.reply(
        `Cannot find user with the given Snowflake \`${routed.v.o.user}\`! Check the User Snowflake sent is correct.\n\nIf you're unsure where to get this value:\n> 1. Go to your **User Settings** >  **Appearance** > Check **Developer Mode** is checked.\n> 2. Right click the user and click **Copy ID** from the menu.`
      )
      return false
    }

    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if user snowflake is already in blacklist/whitelist
    const isAlreadyBlacklisted = decision.userBlacklist.findIndex((u) => u === routed.v.o.user) > -1

    // When user is NOT blacklisted add them
    if (!isAlreadyBlacklisted) {
      decision.userBlacklist.push(routed.v.o.user)

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { userBlacklist: decision.userBlacklist } }, { atomic: true })

      // Inform user
      await routed.reply(`User \`${user.id}\` added to blacklist.`)
    } else {
      // Inform user
      await routed.reply(`User \`${user.id}\` was already blacklisted.`)
    }

    return true
  }

  return false
}

export async function unblacklistUser(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    // Check if user snowflake passed is valid
    const user: User = await routed.bot.client.users
      .fetch(routed.v.o.user)
      .then((u) => {
        return u
      })
      .catch(() => {
        return null
      })
    const userExists = !!user

    // When user does not exist stop here and notify user
    if (!userExists) {
      await routed.reply(
        `Cannot find user with the given Snowflake \`${routed.v.o.user}\`! Check the User Snowflake sent is correct.\n\nIf you're unsure where to get this value:\n> 1. Go to your **User Settings** >  **Appearance** > Check **Developer Mode** is checked.\n> 2. Right click the user and click **Copy ID** from the menu.`
      )
      return false
    }

    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if user snowflake is already in blacklist/whitelist
    const isAlreadyBlacklisted = decision.userBlacklist.findIndex((u) => u === routed.v.o.user) > -1

    // When user is NOT blacklisted let the caller know
    if (!isAlreadyBlacklisted) {
      await routed.reply(`User \`${user.id}\` is not blacklisted on this decision roller.`)
    } else {
      // Remove user from blacklist
      decision.userBlacklist.splice(
        decision.userBlacklist.findIndex((u) => u === user.id),
        1
      )

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { userBlacklist: decision.userBlacklist } }, { atomic: true })
      await routed.reply(`User \`${user.id}\` is no longer blacklisted on this decision roller.`)
    }

    return true
  }

  return false
}

export async function showUserBlacklist(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)
    let response = `The following users (\`${decision.userBlacklist.length}\`) are Blacklisted from this decision \`${decision._id.toString()}\`\n\n`

    // Create list of blacklisted users to DM to author
    if (decision.userBlacklist.length > 0) {
      for (let i = 0; i < decision.userBlacklist.length; i++) {
        const uid = decision.userBlacklist[i]
        const user: User = await routed.bot.client.users
          .fetch(uid)
          .then((u) => {
            return u
          })
          .catch(() => {
            return null
          })

        if (user) response += `@${user.username}#${user.discriminator} \`${user.id}\`\n`
        else response += `\`${uid}\` - This user could not be found.. (account deleted??)`
      }
    }

    // When no one is blacklisted
    else {
      response += `No one is blacklisted!`
    }

    // DM list to caller
    await routed.message.author.send(response)

    return true
  }

  return false
}

export async function whitelistServer(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if server id is already in the whitelist
    const isAlreadyWhitelisted = decision.serverWhitelist.findIndex((s) => s === routed.v.o.serverid) > -1

    // When server id is NOT whitelisted add it
    if (!isAlreadyWhitelisted) {
      decision.serverWhitelist.push(routed.v.o.serverid)

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { serverWhitelist: decision.serverWhitelist } }, { atomic: true })

      // Inform user
      await routed.reply(`Server \`${routed.v.o.serverid}\` added to server whitelist.`)
    } else {
      // Inform user
      await routed.reply(`Server \`${routed.v.o.serverid}\` was already whitelisted.`)
    }

    return true
  }

  return false
}

export async function unwhitelistServer(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if server id is already in the whitelist
    const isAlreadyWhitelisted = decision.serverWhitelist.findIndex((s) => s === routed.v.o.serverid) > -1

    // When server id is NOT whitelisted add it
    if (!isAlreadyWhitelisted) {
      await routed.reply(`Server \`${routed.v.o.serverid}\` is not whitelisted on this decision roller.`)
    } else {
      // Remove user from blacklist
      decision.serverWhitelist.splice(
        decision.serverWhitelist.findIndex((s) => s === routed.v.o.serverid),
        1
      )

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { serverWhitelist: decision.serverWhitelist } }, { atomic: true })
      await routed.reply(`User \`${routed.v.o.serverid}\` is no longer whitelisted on this decision roller.`)
    }

    return true
  }

  return false
}
