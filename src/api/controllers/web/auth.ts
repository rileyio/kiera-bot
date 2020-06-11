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
  }
]

export async function auth(routed: WebRouted) {
  console.log('Incoming user/oauth')
  const v = await validate(Validation.Auth.oauth(), routed.req.body)

  if (!v.valid) {
    console.log('Auth => Invalid')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  try {
    // Is user already stored?
    const storedUser = await routed.Bot.DB.get('users', { id: v.o.id })
    const kieraUser = storedUser ? new TrackedUser(storedUser) : new TrackedUser(v.o)
    const discordUser = await routed.Bot.client.users.fetch(routed.session.userID)

    // If not stored, add record
    if (!storedUser) await routed.Bot.DB.add<TrackedUser>('users', kieraUser)

    // Init Session
    const newSession = new TrackedSession({
      userID: kieraUser.id,
      generatedFor: 'kiera-web',
      otlExpiry: 0,
      otlConsumed: true,
      session: jwt.sign({ discordID: kieraUser.id, userID: kieraUser.id, username: discordUser.username, discriminator: discordUser.username }, process.env.BOT_SECRET, {
        expiresIn: '7d'
      })
    })

    // Store on TrackedSession
    await routed.Bot.DB.add<TrackedSession>('sessions', newSession)

    return routed.res.send({
      success: true,
      username: discordUser.username,
      userID: kieraUser.id,
      discriminator: discordUser.username,
      session: newSession.session
    })
  } catch (error) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }
}

export async function verifySession(routed: WebRouted) {
  // Valid at this point
  return routed.res.send({ success: true })
}
