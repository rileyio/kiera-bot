import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'
import * as jwt from 'jsonwebtoken'

import { WebRoute, WebRouted } from '@/api/web-router'

import { TrackedSession } from '@/objects/session'
import { TrackedUser } from '@/objects/user/'
import { validate } from '@/api/utils/validate'

export const Routes: Array<WebRoute> = [
  {
    controller: auth,
    method: 'post',
    middleware: [Middleware.validateWebSecret],
    name: 'web-auth',
    path: '/api/web/oauth'
  },
  {
    controller: verifySession,
    method: 'post',
    middleware: [Middleware.validateSession],
    name: 'web-session-verify',
    path: '/api/web/verify'
  },
  {
    controller: oauthLogout,
    method: 'post',
    middleware: [Middleware.validateSession],
    name: 'web-logout',
    path: '/api/web/logout'
  }
]

export async function auth(routed: WebRouted) {
  console.log('Incoming user/oauth')
  console.log(routed.req.body)
  const v = await validate(Validation.Auth.oauth(), routed.req.body)

  if (!v.valid) {
    console.log('Something went wrong... OAuth failed')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Begin creating new session
  const storedSession = new TrackedSession({
    generatedFor: 'kiera-web',
    sessionExpiry: Date.now() / 1000 + 86400 * 7,
    userID: routed.req.body.id
  })

  // Valid at this point
  const discordUser = await routed.Bot.client.users.fetch(storedSession.userID)

  // If valid, generate a session token for use with Kiera
  storedSession.session = jwt.sign({ userID: discordUser.id }, process.env.BOT_SECRET, {
    expiresIn: '7d'
  })

  // Get Kiera User Record
  const kieraUser = new TrackedUser((await routed.Bot.DB.get('users', { id: discordUser.id })) || { id: discordUser.id })

  // If no record in db, create one
  if (kieraUser.__notStored) await routed.Bot.DB.add('users', new TrackedUser({ id: discordUser.id }))

  // Store on TrackedSession
  await routed.Bot.DB.add('sessions', storedSession)

  // Valid at this point
  return routed.res.send({
    discriminator: discordUser.discriminator,
    session: storedSession.session,
    success: true,
    userID: discordUser.id,
    username: discordUser.username
  })
}

export async function verifySession(routed: WebRouted) {
  try {
    const discordUser = await routed.Bot.client.users.fetch(routed.session.userID)

    // Valid at this point
    return routed.res.send({
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
      success: true,
      userID: discordUser.id,
      username: discordUser.username
    })
  } catch (error) {
    return routed.next(new errors.BadRequestError())
  }
}

export async function oauthLogout(routed: WebRouted) {
  // Update TrackedSession
  await routed.Bot.DB.update(
    'sessions',
    { _id: routed.session._id },
    {
      $set: {
        terminated: true
      }
    },
    { atomic: true }
  )

  return routed.res.send({ success: true })
}
