import * as jwt from 'jsonwebtoken'

import { TrackedSession } from '@/objects/session'
import { WebRouted } from '@/api/web-router'
import { read as getSecret } from '@/secrets'

export async function isAuthenticatedOwner(routed: WebRouted) {
  // User & Token from header
  const id = routed.req.header('id')
  const token = routed.req.header('webToken')
  const serverID = routed.req.params.serverID
  // Get user from db to verify token
  const user = await routed.Bot.DB.get('users', { guilds: { $elemMatch: { id: serverID, owner: true } }, id, webToken: token })
  // Invalid
  if (!user) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Verify token
  try {
    // Verify token & payload
    const verify = jwt.verify(token, process.env.BOT_SECRET)
    console.log('verify:', verify)
    return routed // PASS
  } catch (error) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }
}

////////////////////////////////////////////
// Valid Session (>= 5.x)
////////////////////////////////////////////

export async function validateSession(routed: WebRouted) {
  const userID = String(routed.req.header('userID'))
  const session = String(routed.req.header('session'))
  let verifiedSession: { userID: string; session: string }

  // If missing, fail
  if (!userID || !session) {
    console.log('ValidateSession => session key missing')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Verify session
  try {
    // Verify session & payload
    verifiedSession = jwt.verify(session, process.env.BOT_SECRET) as typeof verifiedSession
    console.log('ValidateSession => verifiedSession:', verifiedSession)
  } catch (error) {
    console.log('ValidateSession => Session not valid!')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Lookup Session in sessions collection
  const storedSession = await routed.Bot.DB.get('sessions', {
    session,
    userID
  } as Partial<TrackedSession>)

  // If session is found but has been terminated
  if (storedSession.terminated) routed.res.send(401, 'Unauthorized')

  // If valid record is found, return successful
  if (storedSession) {
    // Pass along some session data to help easing future lookups
    routed.session = verifiedSession

    return routed
  }

  // Fallback - fail auth
  console.log('ValidateSession => Session not found!')
  return // FAIL
}

export async function validateWebSecret(routed: WebRouted) {
  const secret = String(routed.req.header('secret'))

  // When Valid
  if (secret === getSecret('BOT_WEB_APP_SERVER_SECRET', routed.Bot.Log.Bot)) {
    return routed
  }

  // Fallback - fail auth
  routed.res.send(401, 'Unauthorized')
  return
}
