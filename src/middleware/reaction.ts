import { RouterRouted } from '@/router'

export function permittedReaction(permittedReacts: Array<string>) {
  return async (routed: RouterRouted) => {
    if (permittedReacts.findIndex(r => r === routed.reaction.reaction) > -1) return routed // Pass
    return // Fall
  }
}
