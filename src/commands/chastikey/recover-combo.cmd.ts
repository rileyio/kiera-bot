import { RoutedInteraction } from '@/router'

/**
 * Recover ChastiKey recent combinations (with optional count to return)
 * @export
 * @param {RoutedInteraction} routed
 */
export async function recoverCombos(routed: RoutedInteraction) {
  const count = routed.interaction.options.get('count')?.value as number

  // Default will be 5 to not clutter the user's DM
  const getCount = count || 5

  // Get user's past locks
  const resp = await routed.bot.Service.ChastiKey.fetchAPICombinations({
    discordid: routed.author.id
  })

  // Stop if error in lookup
  if (resp.response.status !== 200) {
    return await routed.reply(`There has been an error processing your request. Please contact @emma#1366`, true)
  }

  // Catch: If there are no past locks inform the user
  if (resp.locks.length === 0) {
    return await routed.reply(`You have no locks at this time to show, if you believe this is an error please reachout via the \`Kiera Bot\` development/support server.`, true)
  }

  // Sort locks to display an accurate account of past locks
  const sortedLocks = resp.locks.sort((lA, lB) => {
    const x = lA.timestampUnlocked
    const y = lB.timestampUnlocked
    if (x > y) {
      return -1
    }
    if (x < y) {
      return 1
    }
    return 0
  })

  // Get last x # of locks
  const selectedLocks = sortedLocks.slice(0, getCount)

  let message = `Here are your last (${getCount}) **unlocked** locks (Both Deleted and Not):\n`
  message += `\`\`\``

  selectedLocks.forEach((l, i) => {
    message += `Lock ID         ${l.lockID}\n`
    message += `Was locked by   ${l.lockedBy}\n`
    message += `Unlocked        ${new Date(l.timestampUnlocked * 1000)}\n`
    message += `Combination     ${l.combination}\n`
    if (i < selectedLocks.length - 1) message += `\n` // Add extra space between
  })
  message += `\`\`\``

  return await routed.reply(message, true)
}
