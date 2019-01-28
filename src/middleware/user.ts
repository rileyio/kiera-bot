import { RouterRouted } from '../router/router';

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