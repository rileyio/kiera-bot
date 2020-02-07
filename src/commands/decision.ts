import * as Random from 'random'
import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { decisionFromSaved, decisionRealtime } from '@/embedded/decision-embed'
import { sb, en } from '@/utils'

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
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

  // Get the user from the db
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))
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
    owner: user._id
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
  const decision = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id) })
  if (decision) {
    const sd = new TrackedDecision(decision)
    // Halt if decision is disabled
    if (sd.enabled === false) {
      await routed.message.reply(`Decision not enabled!`)
      return true
    }

    // Lookup author
    const author = await routed.message.guild.fetchMember(decision.authorID, false)

    const random = Random.int(0, sd.options.length - 1)
    await routed.message.reply(decisionFromSaved(sd, sd.options[random], { author: author }))
    return true
  }
  return false
}

export async function runRealtimeDecision(routed: RouterRouted) {
  const random = Random.int(0, routed.v.o.args.length - 1)
  await routed.message.reply(decisionRealtime(routed.v.o.question, routed.v.o.args[random]))
  return true
}
