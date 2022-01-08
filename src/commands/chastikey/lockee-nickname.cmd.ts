import { RoutedInteraction } from '@/router'

export async function toggleLockInNickname(routed: RoutedInteraction) {
  const mode = routed.interaction.options.get('mode')?.value as string

  if (mode === 'never' || mode === 'always' || mode === 'locked' || mode === 'unlocked' || mode === 'clear') {
    await routed.bot.DB.update(
      'users',
      { id: routed.author.id },
      { $set: { 'ChastiKey.preferences.lockee.showStatusInNickname': mode === 'clear' ? 'never' : mode } },
      { atomic: true }
    )

    // When Cleared, Clear the Nickname currently set of any padlocks
    if (mode === 'clear') {
      const user = routed.guild.members.cache.get(routed.author.id)
      const currentNickname = user.nickname || user.user.username
      await user.setNickname(currentNickname.replace(/🔒|🔓/, ''))
      return await routed.reply(routed.$render('ChastiKey.Nickname.ModeChangedAndCleared'), true)
    }

    if (mode === 'never' || mode === 'always' || mode === 'locked' || mode === 'unlocked')
      return await routed.reply(routed.$render('ChastiKey.Nickname.ModeChanged', { mode: mode }), true)
  }
}
