import * as Random from 'random'
import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { decisionFromSaved, decisionRealtime } from '@/embedded/decision-embed'
import { TrackedDecisionLogEntry } from '@/objects/decision'

export const Routes = ExportRoutes(
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

export async function runSavedDecision(routed: RouterRouted) {
  const decisionFromDB = await routed.bot.DB.get<TrackedDecision>('decision', { _id: new ObjectID(routed.v.o.id) })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)

    // Halt if user blacklist is triggered
    if (decision.userBlacklist.findIndex(u => u === routed.user.id) > -1) {
      return true // Stop here
    }

    // Halt if decision rolled on server is not whitelisted
    if (decision.serverWhitelist.length > 0) {
      if (decision.serverWhitelist.findIndex(s => s === routed.message.guild.id) === -1) {
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
