import * as Random from 'random'
import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { decisionFromSaved, decisionRealtime } from '@/embedded/decision-embed'
import { sb, en } from '@/utils'
import { TrackedDecisionLogEntry } from '@/objects/decision'
import { decisionLogLast5 } from '@/embedded/decision-log'
import { User } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: newDecision,
    example: '{{prefix}}decision new "name"',
    name: 'decision-new',
    validate: '/decision:string/new:string/name=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: runSavedDecision,
    example: '{{prefix}}decision roll "id"',
    name: 'decision-run-saved',
    validate: '/decision:string/roll:string/id=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: fetchDecisionLog,
    example: '{{prefix}}decision log id',
    name: 'decision-log',
    validate: '/decision:string/log:string/id=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: newDecisionEntry,
    example: '{{prefix}}decision "id" add "Your decision entry here"',
    name: 'decision-new-option',
    validate: '/decision:string/id=string/add:string/text=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: generateNewDecisionID,
    example: '{{prefix}}decision "oldID" new id',
    name: 'decision-new-decision-id',
    validate: '/decision:string/oldid=string/new:string/id:string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: unblacklistUser,
    example: '{{prefix}}decision "id" unblacklist user 146439529824256000',
    name: 'decision-unblacklist-user',
    validate: '/decision:string/id=string/unblacklist:string/user:string/user=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: blacklistUser,
    example: '{{prefix}}decision "id" blacklist user 146439529824256000',
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
    controller: runRealtimeDecision,
    example: '{{prefix}}decision "Question here" "Option 1" "Option 2" "etc.."',
    name: 'decision-realtime',
    validate: '/decision:string/question=string/args...string',
    middleware: [Middleware.isUserRegistered]
  }
)

/**
 * Create a new decision in the DB
 * @export
 * @param {RouterRouted} routed
 */
export async function newDecision(routed: RouterRouted) {
  // Create a new question &
  const nd = new TrackedDecision({
    name: routed.v.o.name,
    authorID: routed.message.author.id,
    serverID: routed.message.guild.id
  })
  const updated = await routed.bot.DB.add('decision', nd)

  if (updated) {
    await routed.message.reply(sb(en.decision.newQuestionAdded, { id: nd._id }))
    return true
  }
  return false
}

export async function newDecisionEntry(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

  // Get the user from the db
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))
  // Get the saved decision from the db (Only the creator can edit)
  var decision = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    authorID: routed.user.id
  })

  if (decision) {
    var ud = new TrackedDecision(decision)
    ud.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
    await routed.bot.DB.update('decision', { _id: decision._id }, ud)
    await routed.message.reply(`Decision entry added \`${routed.v.o.text}\``)
    return true
  }
  return false
}

export async function runSavedDecision(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id) })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)

    // Halt if user blacklist is triggered
    if (decision.userBlacklist.findIndex(u => u === routed.user.id) > -1) {
      return true
    }

    // Halt if decision is disabled
    if (decision.enabled === false) {
      await routed.message.reply(`Decision not enabled!`)
      return true
    }

    // Lookup author
    const author = await routed.message.guild.fetchMember(decision.authorID, false)

    const random = Random.int(0, decision.options.length - 1)
    const outcome = decision.options[random]

    // Track in log
    await routed.bot.DB.add(
      'decision-log',
      new TrackedDecisionLogEntry({
        callerID: routed.user.id,
        decisionID: String(decision._id),
        outcomeID: String(outcome._id),
        serverID: routed.message.channel.type === 'dm' ? 'DM' : routed.message.guild.id,
        channelID: routed.message.channel.type === 'dm' ? 'DM' : routed.message.channel.id
      })
    )

    await routed.message.reply(decisionFromSaved(decision, outcome, { author: author }))
    return true
  }
  return false
}

export async function runRealtimeDecision(routed: RouterRouted) {
  const random = Random.int(0, routed.v.o.args.length - 1)
  await routed.message.reply(decisionRealtime(routed.v.o.question, routed.v.o.args[random]))
  return true
}

export async function fetchDecisionLog(routed: RouterRouted) {
  const log: Array<TrackedDecision> = await routed.bot.DB.aggregate('decision', [
    { $match: { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id } },
    { $project: { _id: { $toString: '$_id' }, name: 1, options: 1 } },
    {
      $lookup: {
        from: 'decision-log',
        localField: '_id',
        foreignField: 'decisionID',
        as: 'log'
      }
    },
    { $unwind: '$log' },
    { $sort: { 'log._id': -1 } },
    { $limit: 5 },
    {
      $group: { _id: '$_id', name: { $first: '$name' }, options: { $first: '$options' }, log: { $push: '$log' } }
    },
    { $project: { _id: 1, name: 1, options: 1, log: 1 } }
  ])

  if (!log) {
    // If nothing comes up, inform the user
    await routed.message.reply('Could not find a decision roll from the ID provided.')
    return true // Stop Here
  }

  const decision = log[0]
  await routed.message.channel.send(decisionLogLast5(decision, routed.user))

  return true
}

export async function generateNewDecisionID(routed: RouterRouted) {
  const oldDecision = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.oldid), authorID: routed.user.id })

  if (oldDecision) {
    const oldID = new ObjectID(oldDecision._id)
    const newID = new ObjectID()

    // Update Decision ID in object
    const decision = new TrackedDecision(Object.assign(oldDecision, { _id: newID }))

    // Insert with new Decision ID into decision collection
    await routed.bot.DB.add<TrackedDecision>('decision', decision)

    // Remove Old Decision from decision collection
    await routed.bot.DB.remove('decision', { _id: oldID })

    // Fetch any records from the decision-log collection to be updated
    await routed.bot.DB.update<TrackedDecisionLogEntry>(
      'decision-log',
      {
        decisionID: oldID.toString()
      },
      { $set: { decisionID: newID.toString() } },
      { atomic: true, updateOne: false }
    )

    // Notify user via DM of the new ID
    await routed.message.author.send(`A new Decision ID has been assigned to \`${oldID.toString()}\`\n\nNew Decision ID: **\`${newID.toString()}\`**`)
    return true
  }

  return false
}

export async function blacklistUser(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    // Check if user snowflake passed is valid
    const user: User = await routed.bot.client
      .fetchUser(routed.v.o.user, false)
      .then(u => {
        return u
      })
      .catch(u => {
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
      .catch(u => {
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
  }

  return false
}
