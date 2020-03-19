import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { sb, en } from '@/utils'
import { TrackedDecisionLogEntry } from '@/objects/decision'
import { CollectorFilter, Message } from 'discord.js'

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
    controller: setDecisionConsumeMode,
    example: '{{prefix}}decision "id" consume mode 0',
    name: 'decision-set-consume-mode',
    validate: '/decision:string/id=string/consume:string/mode:string/setting=number',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'author',
    controller: setConsumeReset,
    example: '{{prefix}}decision "id" consume reset 0',
    name: 'decision-set-consume-reset',
    validate: '/decision:string/id=string/consume:string/reset:string/value?=number',
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
  }
)

/**
 * Create a new decision in the DB
 * @export
 * @param {RouterRouted} routed
 */
export async function newDecision(routed: RouterRouted) {
  // Create a new question &
  const decision = new TrackedDecision({
    name: routed.v.o.name,
    authorID: routed.message.author.id,
    serverID: routed.message.guild.id
  })
  const updated = await routed.bot.DB.add('decision', decision)

  if (updated) {
    await routed.message.reply(sb(en.decision.newQuestionAdded, { id: decision._id }))
    return true
  }
  return false
}

export async function newDecisionEntry(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    authorID: routed.user.id
  })

  if (decisionFromDB) {
    var decision = new TrackedDecision(decisionFromDB)
    decision.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
    await routed.bot.DB.update('decision', { _id: decision._id }, decision)
    await routed.message.reply(`Decision entry added \`${routed.v.o.text}\``)
    return true
  }
  return false
}

export async function generateNewDecisionID(routed: RouterRouted) {
  const oldDecision = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.oldid),
    authorID: routed.user.id
  })

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

export async function setDecisionConsumeMode(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    authorID: routed.user.id
  })

  if (decisionFromDB) {
    var decision = new TrackedDecision(decisionFromDB)
    switch (routed.v.o.setting) {
      case 0:
        await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeMode: 'Basic' } }, { atomic: true })
        break
      case 1:
        await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeMode: 'Temporarily Consume' } }, { atomic: true })
        break
      case 2:
        await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeMode: 'Consume' } }, { atomic: true })
        break
      default:
        await routed.message.reply(Utils.sb(Utils.en.decision.setModeOptions))
        return false
    }

    // If it gets this far confirm change
    await routed.message.reply(`Decision consume mode now set (\`${routed.v.o.setting}\`)!`)

    return true
  }

  return false
}

export async function setConsumeReset(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    authorID: routed.user.id
  })

  if (decisionFromDB) {
    var decision = new TrackedDecision(decisionFromDB)

    console.log('Value:', routed.v.o.value)

    // When a number ( >0 ) is passed as the value
    if (routed.v.o.value > 0 || Number.isNaN(Number(routed.v.o.value)) === false) {
      await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeReset: Number(routed.v.o.value) } }, { atomic: true })
      // If it gets this far confirm change
      await routed.message.reply(`Decision consume mode reset now set (\`${routed.v.o.value}\`)!`)
      return true
    }

    // When '0' is passed as the value
    if (routed.v.o.value === 0) {
      // Only change the reset time if '0' was the value passed
      if (routed.v.o.value === 0) await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeReset: Number(routed.v.o.value) } }, { atomic: true })
      // Reset all options consumed properties
      await routed.bot.DB.update<TrackedDecisionLogEntry>(
        'decision',
        { _id: decision._id },
        { $set: { 'options.$.consumed': false, 'options.$.consumedTime': 0 } },
        { atomic: true, updateOne: false }
      )

      await routed.message.reply(`All decision outcome consumed flags have been reset & the reset time is now \`${routed.v.o.value}\`!`)
      return true
    }

    // When nothing is passed as the value
    if (routed.v.o.value === undefined) {
      await routed.message.reply('To confirm resetting all consumed flags for this decision, send **`yes`** in the next 60 seconds!')

      try {
        // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
        const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.user.id
        // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
        const collected = await routed.message.channel.awaitMessages(filter, { maxMatches: 1, time: 60000, errors: ['time'] })
        // Delete the previous message at this stage
        await Utils.Channel.deleteMessage(routed.message.channel, collected.first().id)
        // Upon valid message collection, begin deletion - notify user
        const pleaseWaitMessage = (await routed.message.reply('Confirmation Received! Resetting all consumed flags for this decision... please wait')) as Message
        // Reset all options consumed properties
        await routed.bot.DB.update(
          'decision',
          { _id: decision._id, 'options.consumed': true },
          { $set: { 'options.$[].consumed': false, 'options.$[].consumedTime': 0 } },
          { atomic: true }
        )
        // Delete the previous message at this stage
        await Utils.Channel.deleteMessage(routed.message.channel, pleaseWaitMessage.id)
        await routed.message.reply(`All decision outcome consumed flags have been reset!`)
        return true
      } catch (error) {
        await routed.message.channel.send(`Decision outcome consumed flag reset cancelled! Reply not received before timeout (1 minute).`)
      }
    }
  }

  return false
}
