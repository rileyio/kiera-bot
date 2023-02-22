import * as XRegExp from 'xregexp'

import { Routed } from '@/router'

/**
 * Set a custom prefix for the first part of decision roll nicknames
 * @export
 * @param {Routed} routed
 */
export async function setPrefix(routed: Routed<'discord-chat-interaction'>) {
  const nickname = routed.interaction.options.get('prefix')?.value as string
  const shortRegex = XRegExp('^([a-z0-9]*)$', 'i')
  const nicknameFixed = nickname.replace(' ', '-')

  // Ensure only valid characters are present
  if (!shortRegex.test(nicknameFixed)) {
    return await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'), true)
  }

  // Ensure there's no collision with another user's nickname
  const isNicknameInUse = await routed.bot.DB.verify('users', { 'Decision.nickname': String(new RegExp(`^${nicknameFixed}$`, 'i')) })
  if (isNicknameInUse) {
    return routed.reply(routed.$render('Decision.Customize.UserNicknameAlreadyInUse'), true)
  }

  const updated = await routed.bot.DB.update(
    'users',
    { id: routed.author.id },
    {
      $set: {
        Decision: {
          nickname: nicknameFixed
        }
      }
    },
    { atomic: true }
  )

  if (updated) return await  routed.reply(routed.$render('Decision.Customize.UserNicknameSet', { nickname: nicknameFixed }), true)
  else return await routed.reply(routed.$render('Decision.Customize.UserNicknameError'), true)

}
