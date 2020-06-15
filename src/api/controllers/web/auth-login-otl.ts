import * as jwt from 'jsonwebtoken'
import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import { WebRouted, WebRoute } from '@/api/web-router'
import { TrackedSession } from '@/objects/session'
import { validate } from '@/api/utils/validate'
import { TrackedUser } from '@/objects/user'

export const Routes: Array<WebRoute> = [
  {
    controller: otl,
    method: 'post',
    name: 'user-otl',
    path: '/api/otl'
  },
  {
    controller: verifySession,
    method: 'post',
    name: 'user-session-verify',
    path: '/api/session/verify',
    middleware: [Middleware.validateSession]
  }
]

export async function otl(routed: WebRouted) {
  const v = await validate(Validation.Auth.otl(), routed.req.body)

  if (!v.valid) {
    console.log('OTL => otl missing')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Lookup Session in sessions collection
  var storedSession = await routed.Bot.DB.get<TrackedSession>('sessions', {
    otl: v.o.otl,
    otlConsumed: false,
    otlExpiry: { $gt: Date.now() / 1000 }
  })

  // When no record, fail Otl
  if (!storedSession) {
    console.log('OTL => No Valid Otl!')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Init Session
  storedSession = new TrackedSession(storedSession)

  // Valid at this point
  const user = await routed.Bot.client.users.fetch(storedSession.userID)

  // If valid, generate a session token for use with Kiera
  const newSessionToken = jwt.sign({ discordID: user.id, userID: storedSession.userID, username: user.username, discriminator: user.discriminator }, process.env.BOT_SECRET, {
    expiresIn: '7d'
  })

  // Get Kiera User Record
  const kieraUser = new TrackedUser(await routed.Bot.DB.get('users', { id: storedSession.userID }))

  // Update TrackedSession
  await routed.Bot.DB.update<TrackedSession>(
    'sessions',
    { _id: storedSession._id },
    {
      $set: {
        session: newSessionToken,
        sessionExpiry: Date.now() / 1000 + 86400 * 7,
        otlConsumed: true
      }
    },
    { atomic: true }
  )

  return routed.res.send({
    success: true,
    username: user.username,
    userID: user.id,
    discriminator: user.discriminator,
    session: newSessionToken,
    chastikey: storedSession.generatedFor === 'kiera-ck' ? { username: kieraUser.ChastiKey.username } : undefined
  })
}

export async function verifySession(routed: WebRouted) {
  // Valid at this point
  return routed.res.send({ success: true })
}
