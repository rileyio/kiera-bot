import { RouterRouted } from '../router/router';
import { TrackedChastiKeyUser } from '../objects/chastikey';
import { TrackedUser } from '../objects/user';

export async function isCKVerified(routed: RouterRouted) {
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: routed.user.id }))
  // Check kiera's as well, override where special conditions apply
  const kieraUser = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: routed.user.id }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] }))

  // Update kiera's record if something is missing
  if (!ckUser._noData && kieraUser._id)
    await routed.bot.DB.update('users', { id: routed.user.id }, { $set: { 'ChastiKey.isVerified': ckUser.isVerified(), 'ChastiKey.username': ckUser.username } }, { atomic: true })

  // Verified!!
  if (!ckUser._noData || kieraUser.ChastiKey.isVerified) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(
    'This command requires your account be verified with ChastiKey using the following command: `!ck verify`\n\nIf you just did this in the last 15 minutes or less, you can speed up some of the verification update process by running `!ck verify` again.'
  )
  return // Returns nothing which halts going any further
}
