import { RouterRouted } from '../router/router';

export function hasRole(role: string | Array<string>) {
  return async (routed: RouterRouted) => {
    // If its a DM, stop processing
    if (routed.message.channel.type === 'dm') return;

    routed.bot.DEBUG_MIDDLEWARE.log(
      'user\'s roles',
      routed.message.member.roles.array().map(r => r.name)
    )

    // Test if its an array
    if (Array.isArray(role)) {
      var contains = false

      role.forEach(r => {
        // Skip further processing if a positive match is found
        if (contains) return;
        contains = routed.message.member.roles.array().find(sr => sr.name === r) !== undefined

        routed.bot.DEBUG_MIDDLEWARE.log(
          'hasRole',
          r,
          contains
        )
      })

      // If theres a match between the 2 arrays
      if (contains) return routed
      return // Returns nothing which halts going any further
    }

    // Test if its a single string
    if (routed.message.member.roles.array().find(r => r.name === role)) {
      routed.bot.DEBUG_MIDDLEWARE.log(
        'hasRole',
        role,
        routed.message.member.roles.array().find(r => r.name === role) !== undefined
      )

      return routed
    }
  }
}