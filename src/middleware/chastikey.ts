import { RouterRouted } from '../router/router';
import { TrackedChastiKeyUser } from '../objects/chastikey';

export async function isCKVerified(routed: RouterRouted) {
  const isVerified = await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: Number(routed.user.id) })
  // Check kiera's as well, override where special conditions apply
  const isVerifiedByKiera = await routed.bot.DB.verify('users', { id: routed.user.id, 'ChastiKey.isVerified': true })

  // If isVerified, update kiera's record if something is missing
  if (isVerified && !isVerifiedByKiera) await routed.bot.DB.update('users', { id: routed.user.id }, { $set: { 'ChastiKey.isVerified': true, 'ChastiKey.username': isVerified.username } }, { atomic: true })

  // Verified!!
  if (isVerified || isVerifiedByKiera) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(
    'This command requires your account be verified with ChastiKey using the following command: `!ck verify`\n\nIf you just did this in the last 15 minutes or less, you can speed up some of the verification update process by running `!ck verify` again.'
  )
  return // Returns nothing which halts going any further
} 