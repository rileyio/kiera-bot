import { RouterRouted } from '../utils/router';

export function hasRole(role: string) {
  return async (routed: RouterRouted) => {
    // If its a DM, stop processing
    if (routed.message.channel.type === 'dm') return;

    routed.bot.DEBUG_MIDDLEWARE('user\'s roles', routed.message.member.roles.array()
      .map(r => r.name))
    routed.bot.DEBUG_MIDDLEWARE('hasRole', role, routed.message.member.roles.array()
      .find(r => r.name === role) !== undefined)

    if (routed.message.member.roles.array().find(r => r.name === role)) {
      return routed
    }
    return // Returns nothing which halts going any further
  }
}