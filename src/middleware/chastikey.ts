import { RouterRouted } from '@/router'
import { UserData } from 'chastikey.js/app/objects'

export async function isCKVerified(routed: RouterRouted) {
  const ckUser = new UserData(
    await routed.bot.DB.get<UserData>('ck-users', { discordID: routed.author.id })
  )

  // When user has a DiscordID in the 'ck-users' data but none with kiera (this means they linked their Discord account)
  // via the ChastiKey App
  if (routed.user.__notStored && ckUser) {
    routed.bot.Log.Command.log(`Middleware -> User with DiscordID: ${routed.author.id} is not in kiera's DB`)
    await routed.message.reply(routed.$render('ChastiKey.Verify.VerifyRequired', { prefix: routed.prefix }))
    return
  }

  // User has previously verified, let them pass for now, likely a Cache data issue or they're still awaiting
  // the cache to update for their user record
  if (routed.user.ChastiKey.isVerified && !ckUser.userID) {
    routed.bot.Log.Command.log(`Middleware -> ChastiKey user previously verified => username: ${routed.author.username}#${routed.author.discriminator}, id: ${routed.author.id}`)
    return routed
  }

  // Update kiera's record if something is missing
  if ((ckUser.username !== routed.user.ChastiKey.username || !routed.user.ChastiKey.isVerified) && !!ckUser.userID) {
    routed.bot.Log.Command.log(`Middleware -> ChastiKey updating user record => isVerified: ${routed.user.ChastiKey.isVerified}, username: ${ckUser.username}`)
    await routed.bot.DB.update(
      'users',
      { id: routed.author.id },
      { $set: { 'ChastiKey.isVerified': !routed.user.ChastiKey.isVerified ? true : false, 'ChastiKey.username': ckUser.username } },
      { atomic: true }
    )

    return routed // No need to hault if this passes
  }

  // Verified!!
  if (!!ckUser.userID && routed.user.ChastiKey.isVerified) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(routed.$render('ChastiKey.Verify.VerifyRequired', { prefix: routed.prefix }))
  routed.bot.Log.Command.log(`Middleware -> ChastiKey user not verified => username: ${routed.author.username}#${routed.author.discriminator}, id: ${routed.author.id}`)
  return // Returns nothing which halts going any further
}
