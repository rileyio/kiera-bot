import * as Middleware from '@/middleware'
import * as XRegExp from 'xregexp'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedDecision } from '@/objects/decision'
import { ObjectID } from 'mongodb'
import { TrackedUser } from '@/objects/user/'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    controller: nicknameDecision,
    description: 'Help.Decision.CustomizeNickname.Description',
    example: '{{prefix}}decision nickname 5c68835bc5b65b2113c7ac7b "nickname-here"',
    name: 'decision-set-nickname',
    validate: '/decision:string/nickname:string/id=string/nickname?=string',
    middleware: [Middleware.isUserRegistered]
  },
  {
    type: 'message',
    category: 'Fun',
    controller: customUsername,
    description: 'Help.Decision.CustomizeUserNickname.Description',
    example: '{{prefix}}decision user nickname NicknameHere',
    name: 'decision-set-user-nickname',
    validate: '/decision:string/user:string/nickname:string/usernick=string',
    middleware: [Middleware.isUserRegistered]
  }
)

/**
 * Set a nickname
 * @export
 * @param {RouterRouted} routed
 */
export async function nicknameDecision(routed: RouterRouted) {
  const shortRegex = XRegExp('^([a-z0-9\\-]*)$', 'i')
  const userNickname = new TrackedUser(
    await routed.bot.DB.get<TrackedUser>('users', { id: routed.author.id })
  )

  // Stop here if the user has not set a short username yet
  if (!userNickname.Decision.nickname) {
    await routed.message.reply(routed.$render('Decision.Customize.UserNicknameNotSet'))
    return true
  }

  const nickname: string = routed.v.o.nickname ? routed.v.o.nickname.replace(' ', '-') : ''
  const decisionFromDB = new TrackedDecision(
    await routed.bot.DB.get<TrackedDecision>('decision', {
      _id: new ObjectID(routed.v.o.id),
      authorID: routed.author.id
    })
  )

  if (decisionFromDB) {
    // If empty, unset in decision roll
    if (nickname.length === 0 && decisionFromDB) {
      const removed = await routed.bot.DB.update('decision', { _id: decisionFromDB._id }, { $unset: 'nickname' }, { atomic: true })
      if (removed) await routed.message.reply(routed.$render('Decision.Customize.NicknameRemoved'))
      else await routed.message.reply(routed.$render('Decision.Customize.NicknameNotRemoved'))
      return true
    }

    // Ensure only valid characters are present
    if (!shortRegex.test(nickname)) {
      await routed.message.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
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
      await routed.message.reply(
        routed.$render('Decision.Customize.NicknameSet', {
          id: decisionFromDB._id.toHexString(),
          name: decisionFromDB.name,
          nickname,
          username: userNickname.Decision.nickname
        })
      )
    else await routed.message.reply(routed.$render('Decision.Customize.NicknameError'))

    return true
  }

  return false
}

/**
 * Set a custom username for the first part of decision roll nicknames
 * @export
 * @param {RouterRouted} routed
 */
export async function customUsername(routed: RouterRouted) {
  const shortRegex = XRegExp('^([a-z0-9]*)$', 'i')
  const nickname = routed.v.o.usernick.replace(' ', '-')

  // Ensure only valid characters are present
  if (!shortRegex.test(nickname)) {
    await routed.message.reply(routed.$render('Decision.Customize.NicknameValidCharacters'))
    return false
  }

  // Ensure there's no collision with another user's nickname
  const isNicknameInUse = await routed.bot.DB.verify('users', { 'Decision.nickname': new RegExp(`^${nickname}$`, 'i') })
  if (isNicknameInUse) {
    routed.message.reply(routed.$render('Decision.Customize.UserNicknameAlreadyInUse'))
    return true
  }

  const updated = await routed.bot.DB.update(
    'users',
    { id: routed.author.id },
    {
      $set: {
        Decision: {
          nickname: nickname
        }
      }
    },
    { atomic: true }
  )

  if (updated) await routed.message.reply(routed.$render('Decision.Customize.UserNicknameSet', { nickname }))
  else await routed.message.reply(routed.$render('Decision.Customize.UserNicknameError'))

  return true
}
