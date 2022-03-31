import { RoutedInteraction } from '@/router'
import { TrackedSession } from '@/objects/session'

export async function extSession(routed: RoutedInteraction) {
  // Create new Session Object
  const newSession = new TrackedSession({ generatedFor: 'kiera-ck', userID: routed.author.id })
  // Generate OTL and store in sessions table
  newSession.newOTL()

  // Store new Session w/OTL
  await routed.bot.DB.add('sessions', newSession)

  // Inform user of their OTL
  return await routed.reply(
    `This is your **Kiera + ChastiKey One Time Login**, __KEEP IT SAFE__, Run the command again to receive a new key \`/ck web\`\n\n**Note:** This will expire in 5 minutes!\n\nUse this to login: ${process.env.API_EXT_DEFAULT_URL}/login/${newSession.otl} \n\n-or- Copy and Paste this in the \`Login Token\` box \`\`\`${newSession.otl}\`\`\``,
    true
  )
}
