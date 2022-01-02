import * as Middleware from '@/middleware'
import * as XRegExp from 'xregexp'

import { ExportRoutes, RoutedInteraction } from '@/router'

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
export async function nicknameDecision(routed: RoutedInteraction) {
  const shortRegex = XRegExp('^([a-z0-9\\-]*)$', 'i')
  const userNickname = new TrackedUser(await routed.bot.DB.get('users', { id: routed.author.id }))
  const nickname = routed.interaction.options.get('nickname')?.value ? String(routed.interaction.options.get('nickname').value).replace(' ', '-') : ''
  const decisionID = routed.interaction.options.get('id')?.value

  // Stop here if the user has not set a short username yet
  if (!userNickname.Decision.nickname) {
    await routed.reply(routed.$render('Decision.Customize.UserNicknameNotSet'))
    return true
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
      else await routed.reply(routed.$render('Decision.Customize.NicknameNotRemoved'))
      return true
    }

    // Ensure only valid characters are present
    if (!shortRegex.test(nickname)) {
      await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
      return false
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
        })
      )
    else await routed.reply(routed.$render('Decision.Customize.NicknameError'))

    return true
  }

  return false
}

/**
 * Set a custom username for the first part of decision roll nicknames
 * @export
 * @param {RoutedInteraction} routed
 */
export async function customUsername(routed: RoutedInteraction) {
  const nickname = routed.interaction.options.get('nickname')?.value as string
  const shortRegex = XRegExp('^([a-z0-9]*)$', 'i')
  const nicknameFixed = nickname.replace(' ', '-')

  // Ensure only valid characters are present
  if (!shortRegex.test(nicknameFixed)) {
    await routed.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
    return false
  }

  // Ensure there's no collision with another user's nickname
  const isNicknameInUse = await routed.bot.DB.verify('users', { 'Decision.nickname': String(new RegExp(`^${nicknameFixed}$`, 'i')) })
  if (isNicknameInUse) {
    routed.reply(routed.$render('Decision.Customize.UserNicknameAlreadyInUse'))
    return true
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

  if (updated) await routed.reply(routed.$render('Decision.Customize.UserNicknameSet', { nickname: nicknameFixed }))
  else await routed.reply(routed.$render('Decision.Customize.UserNicknameError'))

  return true
}
