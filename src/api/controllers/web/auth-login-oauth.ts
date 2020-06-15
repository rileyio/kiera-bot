import * as errors from 'restify-errors'
import * as jwt from 'jsonwebtoken'
import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import { WebRouted, WebRoute } from '@/api/web-router'
import { TrackedSession } from '@/objects/session'
import { validate } from '@/api/utils/validate'
import { TrackedUser } from '@/objects/user'

export const Routes: Array<WebRoute> = [
  {
    controller: auth,
    method: 'post',
    name: 'web-auth',
    path: '/api/web/oauth',
    middleware: [Middleware.validateWebSecret]
  },
  {
    controller: verifySession,
    method: 'post',
    name: 'web-session-verify',
    path: '/api/web/verify',
    middleware: [Middleware.validateSession]
  },
  {
    controller: oauthLogout,
    method: 'post',
    name: 'web-logout',
    path: '/api/web/logout',
    middleware: [Middleware.validateSession]
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
    userID: routed.req.body.id,
    sessionExpiry: Date.now() / 1000 + 86400 * 7,
    generatedFor: 'kiera-web'
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
  await routed.Bot.DB.add<TrackedSession>('sessions', storedSession)

  // Valid at this point
  return routed.res.send({
    success: true,
    userID: discordUser.id,
    session: storedSession.session,
    username: discordUser.username,
    discriminator: discordUser.discriminator
  })
}

export async function verifySession(routed: WebRouted) {
  try {
    const discordUser = await routed.Bot.client.users.fetch(routed.session.userID)

    // Valid at this point
    return routed.res.send({
      success: true,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar
    })
  } catch (error) {
    return routed.next(new errors.BadRequestError())
  }
}

export async function oauthLogout(routed: WebRouted) {
  // Update TrackedSession
  await routed.Bot.DB.update<TrackedSession>(
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
