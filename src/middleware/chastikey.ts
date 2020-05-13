import * as Utils from '@/utils'
import { RouterRouted } from '@/router'
import { TrackedUser } from '@/objects/user'
import { UserData } from 'chastikey.js/app/objects'

export async function isCKVerified(routed: RouterRouted) {
  const ckUser = new UserData(
    await routed.bot.DB.get<UserData>('ck-users', { discordID: routed.user.id })
  )
  // Check kiera's as well, override where special conditions apply
  const kieraUser = new TrackedUser(
    await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: routed.user.id }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] })
  )

  // Update kiera's record if something is missing
  if ((!ckUser.userID && kieraUser._id) || ckUser.username !== kieraUser.ChastiKey.username) {
    await routed.bot.DB.update('users', { id: routed.user.id }, { $set: { 'ChastiKey.isVerified': ckUser.isVerified, 'ChastiKey.username': ckUser.username } }, { atomic: true })
  }

  // Verified!!
  if (ckUser.userID !== undefined || kieraUser.ChastiKey.isVerified) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(routed.$render('ChastiKey.Verify.VerifyRequired'))
  return // Returns nothing which halts going any further
}
