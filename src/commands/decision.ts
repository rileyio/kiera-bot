import * as Utils from '../utils/';
import { RouterRouted } from '../router/router';
import { TrackedUser } from '../objects/user';
import { TrackedDecision, TrackedDecisionOption } from '../objects/decision';
import { ObjectID } from 'bson';
import { decisionFromSaved, decisionRealtime } from '../embedded/decision-embed';

export namespace Decision {
  /**
   * Create a new decision in the DB
   * @export
   * @param {RouterRouted} routed
   */
  export async function newDecision(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
    const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

    // Get the user from the db
    const user = new TrackedUser(await routed.bot.Users.get(userQuery))
    // Create a new question & 
    const nd = new TrackedDecision({ name: routed.v.o.name, owner: user._id })
    const updated = await routed.bot.Decision.add(nd)

    if (updated) {
      await routed.message.reply(
        `New question added (id: \`${nd._id}\`), enter your options using \`!decision ${nd._id} add "Decision result here" \``)
      return true

    }
    return false
  }

  export async function newDecisionEntry(routed: RouterRouted) {
    var decision = await routed.bot.Decision.get({ _id: new ObjectID(routed.v.o.id) })

    if (decision) {
      var ud = new TrackedDecision(decision)
      ud.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
      await routed.bot.Decision.update({ _id: decision._id }, ud)
      await routed.message.reply(`Decision entry added \`${routed.v.o.text}\``)
      return true
    }
    return false
  }

  export async function runSavedDecision(routed: RouterRouted) {
    const decision = await routed.bot.Decision.get({ _id: new ObjectID(routed.v.o.id) })
    if (decision) {
      const sd = new TrackedDecision(decision)
      const random = Math.floor((Math.random() * sd.options.length));
      await routed.message.reply(decisionFromSaved(sd, sd.options[random]))
      return true
    }
    return false
  }

  export async function runRealtimeDecision(routed: RouterRouted) {
    const random = Math.floor((Math.random() * routed.v.o.args.length));
    console.log('test =>', routed.v.o.args[random], routed.v.o.args)
    await routed.message.reply(decisionRealtime(routed.v.o.question, `index:${random} ${routed.v.o.args[random]}`))
    return true
  }
}
