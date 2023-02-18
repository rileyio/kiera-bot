import * as Middleware from '@/middleware'
import * as XRegExp from 'xregexp'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { AcceptedResponse } from '@/objects/router/routed-interaction'
import { ObjectId } from 'mongodb'
import { TrackedDecision } from '@/objects/decision'
import { TrackedUser } from '@/objects/user/'

export const Routes = ExportRoutes(
  {
    category: 'Fun',
    controller: nicknameDecision,
    description: 'Help.Decision.CustomizeNickname.Description',
    example: '{{prefix}}decision nickname 5c68835bc5b65b2113c7ac7b "nickname-here"',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-set-nickname',
    type: 'message',
    validate: '/decision:string/nickname:string/id=string/nickname?=string'
  },
  {
    category: 'Fun',
    controller: customUsername,
    description: 'Help.Decision.CustomizeUserNickname.Description',
    example: '{{prefix}}decision user nickname NicknameHere',
    middleware: [Middleware.isUserRegistered],
    name: 'decision-set-user-nickname',
    type: 'message',
    validate: '/decision:string/user:string/nickname:string/usernick=string'
  }
)

/**
 * Set a nickname
 * @export
 * @param {RoutedInteraction} routed
 */
export async function nicknameDecision(routed: RoutedInteraction): AcceptedResponse {
  const shortRegex = XRegExp('^([a-z0-9\\-]*)$', 'i')
  const userNickname = new TrackedUser(await routed.bot.DB.get('users', { id: routed.author.id }))
  const nickname = routed.interaction.options.get('nickname')?.value ? String(routed.interaction.options.get('nickname').value).replace(' ', '-') : ''
  const decisionID = routed.interaction.options.get('id')?.value as string

  // Stop here if the user has not set a short username yet
  if (!userNickname.Decision.nickname) {
    return await routed.reply(routed.$render('Decision.Customize.UserNicknameNotSet'))
  }

  const decisionFromDB = new TrackedDecision(
    await routed.bot.DB.get('decision', {
      _id: new ObjectId(decisionID),
      authorID: routed.author.id
    })
  )

  if (decisionFromDB) {
    // If empty, unset in decision roll
    if (nickname.length === 0 && decisionFromDB) {
      const removed = await routed.bot.DB.update('decision', { _id: decisionFromDB._id }, { $unset: { nickname: '' } }, { atomic: true })
      if (removed) await routed.reply(routed.$render('Decision.Customize.NicknameRemoved'))
      else return await routed.reply(routed.$render('Decision.Customize.NicknameNotRemoved'))
    }

    // Ensure only valid characters are present
    if (!shortRegex.test(nickname)) {
      return await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
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

    if (!updated) return await routed.reply(routed.$render('Decision.Customize.NicknameError'))
    return await routed.reply(
      routed.$render('Decision.Customize.NicknameSet', {
        id: decisionFromDB._id.toHexString(),
        name: decisionFromDB.name,
        nickname,
        username: userNickname.Decision.nickname
      })
    )
  }
}

/**
 * Set a custom username for the first part of decision roll nicknames
 * @export
 * @param {RoutedInteraction} routed
 */
export async function customUsername(routed: RoutedInteraction): AcceptedResponse {
  const nickname = routed.interaction.options.get('nickname')?.value as string
  const shortRegex = XRegExp('^([a-z0-9]*)$', 'i')
  const nicknameFixed = nickname.replace(' ', '-')

  // Ensure only valid characters are present
  if (!shortRegex.test(nicknameFixed)) {
    return await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
  }

  // Ensure there's no collision with another user's nickname
  const isNicknameInUse = await routed.bot.DB.verify('users', { 'Decision.nickname': String(new RegExp(`^${nicknameFixed}$`, 'i')) })
  if (isNicknameInUse) {
    return routed.reply(routed.$render('Decision.Customize.UserNicknameAlreadyInUse'))
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

  if (updated) return await routed.reply(routed.$render('Decision.Customize.UserNicknameSet', { nickname: nicknameFixed }))
  else return await routed.reply(routed.$render('Decision.Customize.UserNicknameError'))
}
