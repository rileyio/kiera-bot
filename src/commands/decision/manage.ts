import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { sb, en } from '@/utils'
import { TrackedDecisionLogEntry } from '@/objects/decision'

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
