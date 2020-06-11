import { RouterRouted } from '@/router'
import { UserData } from 'chastikey.js/app/objects'

export async function isCKVerified(routed: RouterRouted) {
  const ckUser = new UserData(
    await routed.bot.DB.get<UserData>('ck-users', { discordID: routed.author.id })
  )

  // Update kiera's record if something is missing
  if ((ckUser.username !== routed.user.ChastiKey.username || !routed.user.ChastiKey.isVerified) && ckUser.username !== '') {
    await routed.bot.DB.update(
      'users',
      { id: routed.author.id },
      { $set: { 'ChastiKey.isVerified': !routed.user.ChastiKey.isVerified ? true : false, 'ChastiKey.username': ckUser.username } },
      { atomic: true }
    )
  }

  // Verified!!
  if (ckUser.userID !== undefined || routed.user.ChastiKey.isVerified) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(routed.$render('ChastiKey.Verify.VerifyRequired'))
  return // Returns nothing which halts going any further
}
