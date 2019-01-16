import * as Utils from '../utils';
import { RouterRouted } from '../utils/router';
import { TrackedUser } from '../objects/user';
import { TrackedDecision, TrackedDecisionOption } from '../objects/decision';
import { ObjectID } from 'bson';

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
    console.log('args:', routed.v.o)
    console.log('args:', routed.args)
    console.log('newDecision:', nd)
    const updated = await routed.bot.Decision.add(nd)

    if (updated) {
      await routed.message.reply(
        `New question added (id: \`${nd._id}\`), enter your options using \`!decision ${nd._id} add "Decision result here" \``)
      return true

    }
    return false
  }

  export async function newDecisionText(routed: RouterRouted) {
    var decision = await routed.bot.Decision.get({ _id: new ObjectID(routed.v.o.id) })

    if (decision) {
      decision = new TrackedDecision(this.decisi)
      decision.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
      await routed.bot.Decision.update({ _id: decision._id }, decision)
      return true
    }
    return false
  }
}
