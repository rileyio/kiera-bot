import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { TrackedDecisionLogEntry } from '@/objects/decision'
import { CollectorFilter, Message, TextChannel } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    controller: newDecision,
    description: 'Help.Decision.New.Description',
    example: '{{prefix}}decision new "name"',
    name: 'decision-new',
    validate: '/decision:string/new:string/name=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: addDecisionManager,
    description: 'Help.Decision.GenerateNewID.Description',
    example: '{{prefix}}decision "id" manager add @user#1234',
    name: 'decision-add-manager',
    validate: '/decision:string/id=string/manager:string/add:string/user=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: newDecisionEntry,
    description: 'Help.Decision.NewEntry.Description',
    example: '{{prefix}}decision "id" outcome add "Your decision entry here"',
    name: 'decision-new-outcome',
    validate: '/decision:string/id=string/outcome:string/add:string/text=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: setDecisionConsumeMode,
    description: 'Help.Decision.SetConsumeMode.Description',
    example: '{{prefix}}decision "id" consume mode 0',
    name: 'decision-set-consume-mode',
    validate: '/decision:string/id=string/consume:string/mode:string/setting=number',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: setConsumeReset,
    description: 'Help.Decision.ResetConsumed.Description',
    example: '{{prefix}}decision "id" consume reset 0',
    name: 'decision-set-consume-reset',
    validate: '/decision:string/id=string/consume:string/reset:string/value?=number',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: generateNewDecisionID,
    description: 'Help.Decision.GenerateNewID.Description',
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
    await routed.message.reply(routed.$render('Decision.Edit.NewQuestionAdded', { id: decision._id }))
    return true
  }
  return false
}

export async function newDecisionEntry(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    $or: [{ authorID: routed.user.id }, { managers: { $in: [routed.user.id] } }]
  })

  if (decisionFromDB) {
    var decision = new TrackedDecision(decisionFromDB)
    decision.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
    await routed.bot.DB.update('decision', { _id: decision._id }, decision)
    await routed.message.reply(routed.$render('Decision.Edit.NewEntry', { added: routed.v.o.text }))
    return true
  }
  return false
}

export async function generateNewDecisionID(routed: RouterRouted) {
  const oldDecision = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.oldid),
    $or: [{ authorID: routed.user.id }, { managers: { $in: [routed.user.id] } }]
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
    await routed.message.author.send(routed.$render('Decision.Edit.NewIDAssigned', { oldID: oldID.toString(), newID: newID.toString() }))
    return true
  }

  return false
}

export async function setDecisionConsumeMode(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    $or: [{ authorID: routed.user.id }, { managers: { $in: [routed.user.id] } }]
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
        await routed.message.reply(routed.$render('Decision.Edit.SetModeOptions'))
        return false
    }

    // If it gets this far confirm change
    await routed.message.reply(routed.$render('Decision.Edit.ConsumeModeSet', { change: routed.v.o.setting }))

    return true
  }

  return false
}

export async function setConsumeReset(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  var decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', {
    _id: new ObjectID(routed.v.o.id),
    $or: [{ authorID: routed.user.id }, { managers: { $in: [routed.user.id] } }]
  })

  if (decisionFromDB) {
    var decision = new TrackedDecision(decisionFromDB)

    // When a number ( >0 ) is passed as the value
    if (routed.v.o.value > 0 || Number.isNaN(Number(routed.v.o.value)) === false) {
      await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeReset: Number(routed.v.o.value) } }, { atomic: true })
      // If it gets this far confirm change
      await routed.message.reply(routed.$render('Decision.Edit.SetConsumeReset', { value: routed.v.o.value }))
      return true
    }

    // When '0' is passed as the value
    if (routed.v.o.value === 0) {
      // Only change the reset time if '0' was the value passed
      if (routed.v.o.value === 0) await routed.bot.DB.update('decision', { _id: decision._id }, { $set: { consumeReset: Number(routed.v.o.value) } }, { atomic: true })
      // Reset all options consumed properties
      await routed.bot.DB.update(
        'decision',
        { _id: decision._id, 'options.consumed': true },
        { $set: { 'options.$[].consumed': false, 'options.$[].consumedTime': 0 } },
        { atomic: true }
      )

      await routed.message.reply(routed.$render('Decision.Edit.AllConsumedOutcomesResetTo', { value: routed.v.o.value }))
      return true
    }

    // When nothing is passed as the value
    if (routed.v.o.value === undefined) {
      await routed.message.reply(routed.$render('Decision.Edit.ConfirmResetAllConsumedOutcomes'))

      try {
        // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
        const filter: CollectorFilter = (response: Message) =>
          response.content.toLowerCase().replace(' ', '') === routed.$render('Generic.Word.UppercaseYes').toLowerCase() && response.author.id === routed.user.id
        // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
        const collected = await routed.message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
        // Delete the previous message at this stage
        await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, collected.first().id)
        // Upon valid message collection, begin deletion - notify user
        const pleaseWaitMessage = (await routed.message.reply(routed.$render('Decision.Edit.ConfirmResetAllConsumedOutcomesReceived'))) as Message
        // Reset all options consumed properties
        await routed.bot.DB.update(
          'decision',
          { _id: decision._id, 'options.consumed': true },
          { $set: { 'options.$[].consumed': false, 'options.$[].consumedTime': 0 } },
          { atomic: true }
        )
        // Delete the previous message at this stage
        await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, pleaseWaitMessage.id)
        await routed.message.reply(routed.$render('Decision.Edit.AllConsumedOutcomesReset'))
        return true
      } catch (error) {
        await routed.message.channel.send(routed.$render('Decision.Edit.CancelledResetAllConsumedFlags'))
      }
    }
  }

  return false
}

export async function addDecisionManager(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)
    const mentionedUser = routed.message.mentions.members.first()
    const isAlreadyManager = decision.managers.findIndex((u) => u === mentionedUser.id) > -1

    // Update managers
    if (!isAlreadyManager) decision.managers.push(mentionedUser.id)

    await routed.bot.DB.update('decision', { _id: new ObjectID(routed.v.o.id) }, { $set: { managers: decision.managers } }, { atomic: true })
    return true
  }
}
