import * as XRegExp from 'xregexp'

import { AcceptedResponse, Routed } from '#router/index'

import { ObjectId } from 'mongodb'
import { TrackedDecision } from '#objects/decision'
import { TrackedUser } from '#objects/user/index'

/**
 * Set a nickname
 * @export
 * @param {Routed} routed
 */
export async function setNickname(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const id = routed.interaction.options.get('id').value as string
  const nicknameInput = routed.interaction.options.get('nickname').value as string
  const shortRegex = XRegExp('^([a-z0-9\\-]*)$', 'i')
  const userNickname = new TrackedUser(await routed.bot.DB.get('users', { id: routed.author.id }))

  // Stop here if the user has not set a short username yet
  if (!userNickname.Decision.nickname) {
    return await routed.reply(routed.$render('Decision.Customize.UserNicknameNotSet'), true)
  }

  const nickname: string = nicknameInput ? nicknameInput.replace(' ', '-') : ''
  const decisionFromDB = new TrackedDecision(
    await routed.bot.DB.get('decision', {
      _id: new ObjectId(id),
      authorID: routed.author.id
    })
  )

  if (decisionFromDB) {
    // If empty, unset in decision roll
    if (nickname.length === 0 && decisionFromDB) {
      const removed = await routed.bot.DB.update('decision', { _id: decisionFromDB._id }, { $unset: { nickname: '' } }, { atomic: true })
      if (removed) return await routed.reply(routed.$render('Decision.Customize.NicknameRemoved'), true)
      else return await routed.reply(routed.$render('Decision.Customize.NicknameNotRemoved'), true)
    }

    // Ensure only valid characters are present
    if (!shortRegex.test(nickname)) {
      return await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'), true)
    }

    const updated = await routed.bot.DB.update(
      'decision',
      { _id: decisionFromDB._id },
      {
        $set: {
          nickname: nickname
        }
      },
      { atomic: true }
    )

    if (updated)
      await routed.reply(
        routed.$render('Decision.Customize.NicknameSet', {
          id: decisionFromDB._id.toHexString(),
          name: decisionFromDB.name,
          nickname,
          username: userNickname.Decision.nickname
        }),
        true
      )
    else return await routed.reply(routed.$render('Decision.Customize.NicknameError'), true)
  }
}
