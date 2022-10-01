import { ChannelType } from 'discord.js'
import { RouterRouted } from '@/router'

export function hasRole(role: string | Array<string>) {
  return async (routed: RouterRouted) => {
    // If its a DM, stop processing
    if (routed.message.channel.type === ChannelType.DM) return

    routed.bot.Log.Router.log(
      `user's roles`,
      [...routed.message.member.roles.cache.values()].map((r) => r.name.toLocaleLowerCase())
    )

    // Test if its an array
    if (Array.isArray(role)) {
      let contains = false

      role.forEach((r) => {
        // Skip further processing if a positive match is found
        if (contains) return
        contains = [...routed.message.member.roles.cache.values()].find((sr) => sr.name.toLocaleLowerCase() === r) !== undefined

        routed.bot.Log.Router.log('hasRole', r, contains)
      })

      // If theres a match between the 2 arrays
      if (contains) return routed
      return // Returns nothing which halts going any further
    }

    // Test if its a single string
    if ([...routed.message.member.roles.cache.values()].find((r) => r.name.toLocaleLowerCase() === role)) {
      routed.bot.Log.Router.log('hasRole', role, [...routed.message.member.roles.cache.values()].find((r) => r.name.toLocaleLowerCase() === role) !== undefined)

      return routed
    }
  }
}
