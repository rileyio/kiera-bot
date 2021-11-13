import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'
import { Message, TextChannel } from 'discord.js'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'

import { ObjectId } from 'bson'
import { TrackedDecisionLogEntry } from '@/objects/decision'

export const Routes = ExportRoutes(
  {
    category: 'Fun',
    controller: newDecision,
    description: 'Help.Decision.New.Description',
    example: '{{prefix}}decision new "name"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-new',
    type: 'message',
    validate: '/decision:string/new:string/name=string'
  },
  {
    category: 'Fun',
    controller: addDecisionManager,
    description: 'Help.Decision.AddManager.Description',
    example: '{{prefix}}decision "id" manager add @user#1234',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-add-manager',
    type: 'message',
    validate: '/decision:string/id=string/manager:string/add:string/user=string'
  },
  {
    category: 'Fun',
    controller: removeDecisionManager,
    description: 'Help.Decision.RemoveManager.Description',
    example: '{{prefix}}decision "id" manager remove @user#1234',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-remove-manager',
    type: 'message',
    validate: '/decision:string/id=string/manager:string/remove:string/user=string'
  },
  {
    category: 'Fun',
    controller: transferDecisionOwnership,
    description: 'Help.Decision.TransferOwnership.Description',
    example: '{{prefix}}decision "id" ownership transfer @user#1234',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-transfer-ownership',
    type: 'message',
    validate: '/decision:string/id=string/ownership:string/transfer:string/user=string'
  },
  {
    category: 'Fun',
    controller: newDecisionEntry,
    description: 'Help.Decision.NewEntry.Description',
    example: '{{prefix}}decision "id" outcome add "Your decision entry here"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-new-outcome',
    type: 'message',
    validate: '/decision:string/id=string/outcome:string/add:string/text=string'
  },
  {
    category: 'Fun',
    controller: setDecisionConsumeMode,
    description: 'Help.Decision.SetConsumeMode.Description',
    example: '{{prefix}}decision "id" consume mode 0',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-set-consume-mode',
    type: 'message',
    validate: '/decision:string/id=string/consume:string/mode:string/setting=number'
  },
  {
    category: 'Fun',
    controller: setConsumeReset,
    description: 'Help.Decision.ResetConsumed.Description',
    example: '{{prefix}}decision "id" consume reset 0',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-set-consume-reset',
    type: 'message',
    validate: '/decision:string/id=string/consume:string/reset:string/value?=number'
  },
  {
    category: 'Fun',
    controller: generateNewDecisionID,
    description: 'Help.Decision.GenerateNewID.Description',
    example: '{{prefix}}decision "oldID" new id',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-new-decision-id',
    type: 'message',
    validate: '/decision:string/oldid=string/new:string/id:string'
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
    authorID: routed.message.author.id,
    name: routed.v.o.name,
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
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)
    decision.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
    await routed.bot.DB.update('decision', { _id: decision._id }, decision)
    await routed.message.reply(routed.$render('Decision.Edit.NewEntry', { added: routed.v.o.text }))
    return true
  }
  return false
}

export async function generateNewDecisionID(routed: RouterRouted) {
  const oldDecision = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.oldid)
  })

  if (oldDecision) {
    const oldID = new ObjectId(oldDecision._id)
    const newID = new ObjectId()

    // Update Decision ID in object
    const decision = new TrackedDecision(Object.assign(oldDecision, { _id: newID }))

    // Insert with new Decision ID into decision collection
    await routed.bot.DB.add('decision', decision)

    // Remove Old Decision from decision collection
    await routed.bot.DB.remove('decision', { _id: oldID })

    // Fetch any records from the decision-log collection to be updated
    await routed.bot.DB.update(
      'decision-log',
      {
        decisionID: oldID.toString()
      },
      { $set: { decisionID: newID.toString() } },
      { atomic: true, updateOne: false }
    )

    // Notify user via DM of the new ID
    await routed.message.author.send(
      routed.$render('Decision.Edit.NewIDAssigned', {
        newID: newID.toString(),
        oldID: oldID.toString()
      })
    )
    return true
  }

  return false
}

export async function setDecisionConsumeMode(routed: RouterRouted) {
  // Get the saved decision from the db (Only the creator can edit)
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)
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
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(routed.v.o.id)
  })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)

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
        const filter = (response: Message) =>
          response.content.toLowerCase().replace(' ', '') === routed.$render('Generic.Word.UppercaseYes').toLowerCase() && response.author.id === routed.author.id
        // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
        const collected = await routed.message.channel.awaitMessages({
          errors: ['time'],
          filter,
          max: 1,
          time: 60000
        })
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
  const decisionFromDB = await routed.bot.DB.get('decision', { _id: new ObjectId(routed.v.o.id), authorID: routed.author.id })
  const mentionedUser = routed.message.mentions.members.first()

  if (decisionFromDB && mentionedUser) {
    const decision = new TrackedDecision(decisionFromDB)
    const isAlreadyManager = decision.managers.findIndex((u) => u === mentionedUser.id) > -1

    // Update managers
    if (!isAlreadyManager) decision.managers.push(mentionedUser.id)

    await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { managers: decision.managers } }, { atomic: true })
    await routed.message.reply(routed.$render('Decision.Edit.AddedManager', { id: routed.v.o.id, user: Utils.User.buildUserWrappedSnowflake(mentionedUser.id) }))
    return true
  }
}

export async function removeDecisionManager(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', { _id: new ObjectId(routed.v.o.id), authorID: routed.author.id })
  const mentionedUser = routed.message.mentions.members.first()

  if (decisionFromDB && mentionedUser) {
    const decision = new TrackedDecision(decisionFromDB)
    const isAlreadyManager = decision.managers.findIndex((u) => u === mentionedUser.id) > -1

    // Update managers
    if (isAlreadyManager) {
      decision.managers.splice(
        decision.managers.findIndex((u) => u === mentionedUser.id),
        1
      )
    }

    await routed.bot.DB.update('decision', { _id: new ObjectId(routed.v.o.id) }, { $set: { managers: decision.managers } }, { atomic: true })
    await routed.message.reply(routed.$render('Decision.Edit.RemovedManager', { id: routed.v.o.id, user: Utils.User.buildUserWrappedSnowflake(mentionedUser.id) }))
    return true
  }
}

export async function transferDecisionOwnership(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get('decision', { _id: new ObjectId(routed.v.o.id), authorID: routed.author.id })
  const mentionedUser = routed.message.mentions.members.first()

  if (decisionFromDB && mentionedUser) {
    const decision = new TrackedDecision(decisionFromDB)

    // Make new owner by updating the authorID field
    await routed.bot.DB.update('decision', { _id: decision._id, authorID: routed.author.id }, { $set: { authorID: mentionedUser.id } }, { atomic: true })
    await routed.message.reply(routed.$render('Decision.Edit.OwnershipTransfered', { id: routed.v.o.id, user: Utils.User.buildUserWrappedSnowflake(mentionedUser.id) }))
    return true
  }
}
