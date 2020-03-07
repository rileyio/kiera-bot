import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { User } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: unblacklistUser,
    example: '{{prefix}}decision "id" unblacklist user "userSnowflake"',
    name: 'decision-unblacklist-user',
    validate: '/decision:string/id=string/unblacklist:string/user:string/user=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: blacklistUser,
    example: '{{prefix}}decision "id" blacklist user "userSnowflake"',
    name: 'decision-blacklist-user',
    validate: '/decision:string/id=string/blacklist:string/user:string/user=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: showUserBlacklist,
    example: '{{prefix}}decision "id" blacklisted users',
    name: 'decision-blacklist-show',
    validate: '/decision:string/id=string/blacklisted:string/users:string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: unwhitelistServer,
    example: '{{prefix}}decision "id" unwhitelist server "serverID"',
    name: 'decision-whitelist-server',
    validate: '/decision:string/id=string/unwhitelist:string/server:string/serverid=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: whitelistServer,
    example: '{{prefix}}decision "id" whitelist server "serverID"',
    name: 'decision-whitelist-server',
    validate: '/decision:string/id=string/whitelist:string/server:string/serverid=string',
    middleware: [Middleware.isUserRegistered]
  }
)

export async function blacklistUser(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Check if user snowflake passed is valid
    const user: User = await routed.bot.client
      .fetchUser(routed.v.o.user, false)
      .then(u => {
        return u
      })
      .catch(e => {
        return null
      })
    const userExists = !!user

    // When user does not exist stop here and notify user
    if (!userExists) {
      await routed.message.reply(
        `Cannot find user with the given Snowflake \`${routed.v.o.user}\`! Check the User Snowflake sent is correct.\n\nIf you're unsure where to get this value:\n> 1. Go to your **User Settings** >  **Appearance** > Check **Developer Mode** is checked.\n> 2. Right click the user and click **Copy ID** from the menu.`
      )
      return false
    }

    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if user snowflake is already in blacklist/whitelist
    const isAlreadyBlacklisted = decision.userBlacklist.findIndex(u => u === routed.v.o.user) > -1

    // When user is NOT blacklisted add them
    if (!isAlreadyBlacklisted) {
      decision.userBlacklist.push(routed.v.o.user)

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectID(routed.v.o.id) }, { $set: { userBlacklist: decision.userBlacklist } }, { atomic: true })

      // Inform user
      await routed.message.reply(`User \`${user.id}\` added to blacklist.`)
    } else {
      // Inform user
      await routed.message.reply(`User \`${user.id}\` was already blacklisted.`)
    }

    return true
  }

  return false
}

export async function unblacklistUser(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Check if user snowflake passed is valid
    const user: User = await routed.bot.client
      .fetchUser(routed.v.o.user, false)
      .then(u => {
        return u
      })
      .catch(e => {
        return null
      })
    const userExists = !!user

    // When user does not exist stop here and notify user
    if (!userExists) {
      await routed.message.reply(
        `Cannot find user with the given Snowflake \`${routed.v.o.user}\`! Check the User Snowflake sent is correct.\n\nIf you're unsure where to get this value:\n> 1. Go to your **User Settings** >  **Appearance** > Check **Developer Mode** is checked.\n> 2. Right click the user and click **Copy ID** from the menu.`
      )
      return false
    }

    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if user snowflake is already in blacklist/whitelist
    const isAlreadyBlacklisted = decision.userBlacklist.findIndex(u => u === routed.v.o.user) > -1

    // When user is NOT blacklisted let the caller know
    if (!isAlreadyBlacklisted) {
      await routed.message.reply(`User \`${user.id}\` is not blacklisted on this decision roller.`)
    } else {
      // Remove user from blacklist
      decision.userBlacklist.splice(
        decision.userBlacklist.findIndex(u => u === user.id),
        1
      )

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectID(routed.v.o.id) }, { $set: { userBlacklist: decision.userBlacklist } }, { atomic: true })
      await routed.message.reply(`User \`${user.id}\` is no longer blacklisted on this decision roller.`)
    }

    return true
  }

  return false
}

export async function showUserBlacklist(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)
    var response = `The following users (\`${decision.userBlacklist.length}\`) are Blacklisted from this decision \`${decision._id.toString()}\`\n\n`

    // Create list of blacklisted users to DM to author
    if (decision.userBlacklist.length > 0) {
      for (var i = 0; i < decision.userBlacklist.length; i++) {
        const uid = decision.userBlacklist[i]
        const user: User = await routed.bot.client
          .fetchUser(uid, false)
          .then(u => {
            return u
          })
          .catch(u => {
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
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if server id is already in the whitelist
    const isAlreadyWhitelisted = decision.serverWhitelist.findIndex(s => s === routed.v.o.serverid) > -1

    // When server id is NOT whitelisted add it
    if (!isAlreadyWhitelisted) {
      decision.serverWhitelist.push(routed.v.o.serverid)

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectID(routed.v.o.id) }, { $set: { serverWhitelist: decision.serverWhitelist } }, { atomic: true })

      // Inform user
      await routed.message.reply(`Server \`${routed.v.o.serverid}\` added to server whitelist.`)
    } else {
      // Inform user
      await routed.message.reply(`Server \`${routed.v.o.serverid}\` was already whitelisted.`)
    }

    return true
  }

  return false
}

export async function unwhitelistServer(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Construct
    const decision = new TrackedDecision(decisionFromDB)

    // Check if server id is already in the whitelist
    const isAlreadyWhitelisted = decision.serverWhitelist.findIndex(s => s === routed.v.o.serverid) > -1

    // When server id is NOT whitelisted add it
    if (!isAlreadyWhitelisted) {
      await routed.message.reply(`Server \`${routed.v.o.serverid}\` is not whitelisted on this decision roller.`)
    } else {
      // Remove user from blacklist
      decision.serverWhitelist.splice(
        decision.serverWhitelist.findIndex(s => s === routed.v.o.serverid),
        1
      )

      // Update DB
      await routed.bot.DB.update('decision', { _id: new ObjectID(routed.v.o.id) }, { $set: { serverWhitelist: decision.serverWhitelist } }, { atomic: true })
      await routed.message.reply(`User \`${routed.v.o.serverid}\` is no longer whitelisted on this decision roller.`)
    }

    return true
  }

  return false
}
