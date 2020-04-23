import { RouterRouted } from '@/router'

export async function isUserRegistered(routed: RouterRouted) {
  const isRegistered = await routed.bot.DB.verify('users', routed.user.id)
  if (isRegistered) return routed // No need to hault if this passes
  // Fallback, user not yet registered
  await routed.message.reply(
    'This command requires you to be registered, this can be done using: `!register`\n\
     Registering opts you into having some basic account user ids stored in order for the\n\
     bot to function normally for commands requiring stored values.'
  )
  return // Returns nothing which halts going any further
}

export async function isModerator(routed: RouterRouted) {
  const modRole = routed.message.guild.roles.cache.find((r) => r.name.toLowerCase() === 'moderator')
  // User calling this command must be higher than the khRole to call update upon another user than themself
  if (routed.message.member.roles.highest.position >= modRole.position) return routed // No need to hault if this passes
  return // Returns nothing which halts going any further
}
