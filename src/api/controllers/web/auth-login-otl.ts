import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import * as jwt from 'jsonwebtoken'

import { WebRoute, WebRouted } from '@/api/web-router'

import { TrackedSession } from '@/objects/session'
import { TrackedUser } from '@/objects/user/'
import { validate } from '@/api/utils/validate'

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
    middleware: [Middleware.validateSession],
    name: 'user-session-verify',
    path: '/api/session/verify'
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
  let storedSession = await routed.Bot.DB.get('sessions', {
    otl: v.o.otl,
    otlConsumed: false,
    otlExpiry: {
      $gt: Date.now() / 1000
    }
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
  const newSessionToken = jwt.sign(
    {
      discordID: user.id,
      discriminator: user.discriminator,
      userID: storedSession.userID,
      username: user.username
    },
    process.env.BOT_SECRET,
    {
      expiresIn: '7d'
    }
  )

  // Get Kiera User Record
  const kieraUser = new TrackedUser(await routed.Bot.DB.get('users', { id: storedSession.userID }))

  // Update TrackedSession
  await routed.Bot.DB.update(
    'sessions',
    { _id: storedSession._id },
    {
      $set: {
        otlConsumed: true,
        session: newSessionToken,
        sessionExpiry: Date.now() / 1000 + 86400 * 7
      }
    },
    { atomic: true }
  )

  return routed.res.send({
    chastikey:
      storedSession.generatedFor === 'kiera-ck'
        ? {
            username: kieraUser.ChastiKey.username
          }
        : undefined,
    discriminator: user.discriminator,
    session: newSessionToken,
    success: true,
    userID: user.id,
    username: user.username
  })
}

export async function verifySession(routed: WebRouted) {
  // Valid at this point
  return routed.res.send({ success: true })
}
