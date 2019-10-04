import { RouterRouted } from '../router/router';

export async function isCKVerified(routed: RouterRouted) {
  const isVerified = await routed.bot.DB.verify('ck-users', { discordID: Number(routed.user.id) })
  if (isVerified) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(
    'This command requires your account be verified with ChastiKey using the following command: `!ck verify`'
  )
  return // Returns nothing which halts going any further
}