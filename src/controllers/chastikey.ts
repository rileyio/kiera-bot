import * as Utils from '../utils';
import { TrackedUser } from '../objects/user';
import { RouterRouted } from '../utils/router';

// Export sub controllers to keep this file clean
import * as CKTicker from './chastikey/ticker';

export namespace ChastiKey {
  export const Ticker = CKTicker

/**
 *  Sets username for ChastiKey
 * @export
 * @param {RouterRouted} routed
 */
export async function setUsername(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
    const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

    // Get the user from the db in their current state
    const user = new TrackedUser(await routed.bot.Users.get(userQuery))
    // Change/Update TrackedChastiKey.Username Prop
    user.ChastiKey.username = routed.v.o.ckusername
    // Commit change to db
    const updateResult = await routed.bot.Users.update(userQuery, user)

    if (updateResult > 0) {
      await routed.message.author.send(`:white_check_mark: ChastiKey Username now set to: \`${routed.v.o.ckusername}\``)
      routed.bot.DEBUG_MSG_COMMAND.log(`!ck username ${routed.v.o.ckusername}`)
    }
    else {
      routed.bot.DEBUG_MSG_COMMAND.log(`!ck username ${routed.v.o.ckusername} -> update unsuccessful!`)
    }
  }
}
