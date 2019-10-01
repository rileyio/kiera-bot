import { RouterRouted } from '../router/router';

export async function isCKVerified(routed: RouterRouted) {
  const isVerifiedLockee = await routed.bot.DB.verify('ck-lockees', { discordID: Number(routed.user.id) })
  const isVerifiedKH = await routed.bot.DB.verify('ck-keyholders', { discordID: Number(routed.user.id) })
  if (isVerifiedLockee || isVerifiedKH) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(
    'This command requires your account be verified with ChastiKey using the following command: `!ck verify`'
  )
  return // Returns nothing which halts going any further
}