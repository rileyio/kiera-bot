import * as Random from 'random'
import * as XRegExp from 'xregexp'

import { ObjectID } from 'bson'
import { RoutedInteraction } from '@/router'
import { TrackedDecision } from '@/objects/decision'
import { TrackedUser } from '@/objects/user/'
import { decisionFromSaved } from '@/commands/decision/roll.embed'

export async function runSavedDecision(routed: RoutedInteraction) {
  const idOrNickname = routed.interaction.options.get('id').value as string
  const shortRegex = XRegExp('^(?<username>[a-z0-9]*):(?<nickname>[a-z0-9-]*)$', 'i')
  const isShort = shortRegex.test(idOrNickname)
  const shortMatch = isShort ? XRegExp.exec(idOrNickname, shortRegex) : null
  const userNickname = isShort ? shortMatch['username'] : null
  const decisionNickname = isShort ? shortMatch['nickname'] : null

  const userByNickname = new TrackedUser(isShort ? await routed.bot.DB.get('users', { 'Decision.nickname': new RegExp(`^${userNickname}$`, 'i') }) : {})
  const decisionFromDB = isShort
    ? await routed.bot.DB.get('decision', { authorID: userByNickname.id, nickname: new RegExp(`^${decisionNickname}$`, 'i') })
    : await routed.bot.DB.get('decision', { _id: new ObjectID(idOrNickname) })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)

    // Halt if user blacklist is triggered
    if (decision.userBlacklist.findIndex((u) => u === routed.author.id) > -1) {
      return true // Stop here
    }

    // Halt if decision rolled on server is not whitelisted
    if (decision.serverWhitelist.length > 0) {
      if (decision.serverWhitelist.findIndex((s) => s === routed.guild.id) === -1) {
        await routed.reply(`This decision roll (\`${decision._id.toString()}\`) cannot be used on this server!`)
        return true // Stop here
      }
    }

    // Halt if decision is disabled
    if (decision.enabled === false) {
      return await routed.reply(`Decision not enabled!`)
    }

    // Lookup author
    let authorName: string
    let authorAvatar: string
    let authorID: string

    try {
      const authorLookup = await routed.guild.members.fetch(decision.authorID)

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
    if (decision.consumeMode === 'Basic' || decision.consumeMode === undefined) optionsPool = decision.options

    // If the outcomes pool is empty: Inform and stop there
    if (optionsPool.length === 0) {
      if (decision.consumeMode === 'Temporarily Consume') await routed.reply(`This decision roll has limiting enabled. There are no outcomes available at this time.`)
      if (decision.consumeMode === 'Consume') await routed.reply(`This decision roll has limiting enabled. There are no outcomes available anymore.`)
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
    await routed.reply({ embeds: [outcomeEmbed] })

    // Track in log
    await routed.bot.DB.add('decision-log', {
      callerID: routed.author.id,
      channelID: routed.channel.type === 'DM' ? 'DM' : routed.channel.id,
      decisionID: String(decision._id),
      outcomeContent: outcomeEmbed.description,
      outcomeID: String(outcome._id),
      serverID: routed.channel.type === 'DM' ? 'DM' : routed.guild.id
    })

    return true
  }
  return false
}
