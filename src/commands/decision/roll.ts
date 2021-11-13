import * as Middleware from '@/middleware'
import * as Random from 'random'
import * as XRegExp from 'xregexp'

import { ExportRoutes, RouterRouted } from '@/router'
import { decisionFromSaved, decisionRealtime } from '@/embedded/decision-embed'

import { ObjectId } from 'bson'
import { TrackedDecision } from '@/objects/decision'
import { TrackedUser } from '@/objects/user/'

export const Routes = ExportRoutes(
  {
    category: 'Fun',
    controller: runSavedDecision,
    description: 'Help.Decision.Roll.Description',
    example: '{{prefix}}decision roll "id"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-run-saved',
    type: 'message',
    validate: '/decision:string/roll:string/id=string',
    validateAlias: ['/decision:string/r:string/id=string']
  },
  {
    category: 'Fun',
    controller: runRealtimeDecision,
    description: 'Help.Decision.RollRealtime.Description',
    example: '{{prefix}}decision "Question here" "Option 1" "Option 2" "etc.."',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-realtime',
    type: 'message',
    validate: '/decision:string/question=string/args...string'
  }
)

export async function runSavedDecision(routed: RouterRouted) {
  const shortRegex = XRegExp('^(?<username>[a-z0-9]*):(?<nickname>[a-z0-9-]*)$', 'i')
  const isShort = shortRegex.test(routed.v.o.id)
  const shortMatch = isShort ? XRegExp.exec(routed.v.o.id, shortRegex) : null
  const userNickname = isShort ? shortMatch['username'] : null
  const decisionNickname = isShort ? shortMatch['nickname'] : null
  const userByNickname = new TrackedUser(isShort ? await routed.bot.DB.get('users', { 'Decision.nickname': String(new RegExp(`^${userNickname}$`, 'i')) }) : {})
  const decisionFromDB = isShort
    ? await routed.bot.DB.get('decision', { authorID: userByNickname.id, nickname: String(new RegExp(`^${decisionNickname}$`, 'i')) })
    : await routed.bot.DB.get('decision', { _id: new ObjectId(routed.v.o.id) })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)

    // Halt if user blacklist is triggered
    if (decision.userBlacklist.findIndex((u) => u === routed.author.id) > -1) {
      return true // Stop here
    }

    // Halt if decision rolled on server is not whitelisted
    if (decision.serverWhitelist.length > 0) {
      if (decision.serverWhitelist.findIndex((s) => s === routed.message.guild.id) === -1) {
        await routed.message.reply(`This decision roll (\`${decision._id.toString()}\`) cannot be used on this server!`)
        return true // Stop here
      }
    }

    // Halt if decision is disabled
    if (decision.enabled === false) {
      await routed.message.reply(`Decision not enabled!`)
      return true // Stop here
    }

    // Lookup author
    let authorName: string
    let authorAvatar: string
    let authorID: string

    try {
      const authorLookup = await routed.message.guild.members.fetch(decision.authorID)

      authorName = `${authorLookup.nickname || authorLookup.user.username}#${authorLookup.user.discriminator}`
      authorAvatar = authorLookup.user.avatar
      authorID = authorLookup.user.id
    } catch (error) {
      authorName = decision.authorID
      authorAvatar = ''
      authorID = decision.authorID
    }

    let optionsPool = []

    // When 'consumeMode' is Temporarily Consume, remove options from the pool depending on the setting
    if (decision.consumeMode === 'Temporarily Consume') {
      // Check timed decisions if they fall within the consume time (if set)
      decision.options.forEach((d) => {
        // Remove if criteria is met
        if (Date.now() - d.consumedTime <= decision.consumeReset * 1000) {
          // console.log(
          //   'Temporarily Consume: Removing Option ->',
          //   decision.options.findIndex(dd => dd._id === d._id),
          //   d._id.toHexString()
          // )
        }
        // Add to pool
        else {
          optionsPool.push(d)
        }
      })
    }

    // When 'consumeMode' is Consume, remove options from the pool
    if (decision.consumeMode === 'Consume') {
      // Check if consumed is 'true', if so remove it
      decision.options.forEach((d) => {
        // Remove if criteria is met
        if (!d.consumed) optionsPool.push(d)
      })
    }

    // When 'Basic' is used for Consume Mode
    if (decision.consumeMode === 'Basic') optionsPool = decision.options

    // If the outcomes pool is empty: Inform and stop there
    if (optionsPool.length === 0) {
      if (decision.consumeMode === 'Temporarily Consume') await routed.message.reply(`This decision roll has limiting enabled. There are no outcomes available at this time.`)
      if (decision.consumeMode === 'Consume') await routed.message.reply(`This decision roll has limiting enabled. There are no outcomes available anymore.`)
      return true
    }

    const random = Random.int(0, optionsPool.length - 1)
    const outcome = optionsPool[random]

    // Update Decision's Outcome to track consumed state (If something other than 'Basic' is set for the mode)
    if (decision.consumeMode !== 'Basic') {
      await routed.bot.DB.update(
        'decision',
        { _id: decision._id, 'options._id': outcome._id },
        { $set: { 'options.$.consumed': true, 'options.$.consumedTime': Date.now() } },
        { atomic: true }
      )
    }

    const outcomeEmbed = decisionFromSaved(decision, outcome, { avatar: authorAvatar, id: authorID, name: authorName, server: { prefix: routed.prefix } })
    await routed.message.reply({ embeds: [outcomeEmbed] })

    // Track in log
    await routed.bot.DB.add('decision-log', {
      callerID: routed.author.id,
      channelID: routed.message.channel.type === 'DM' ? 'DM' : routed.message.channel.id,
      decisionID: String(decision._id),
      outcomeContent: outcomeEmbed.description,
      outcomeID: String(outcome._id),
      serverID: routed.message.channel.type === 'DM' ? 'DM' : routed.message.guild.id
    })

    return true
  }
  return false
}

export async function runRealtimeDecision(routed: RouterRouted) {
  const random = Random.int(0, routed.v.o.args.length - 1)
  await routed.message.reply({ embeds: [decisionRealtime(routed.v.o.question, routed.v.o.args[random])] })
  return true
}
