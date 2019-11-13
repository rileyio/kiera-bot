import * as jwt from 'jsonwebtoken'
import { WebRouted } from '../web-router'
import { AuthKey } from '../../objects/authkey'
import { TrackedUser } from '../../objects/user'

export async function isAuthenticatedOwner(routed: WebRouted) {
  // User & Token from header
  const id = routed.req.header('id')
  const token = routed.req.header('webToken')
  const serverID = routed.req.params.serverID
  // Get user from db to verify token
  const user = await routed.Bot.DB.get<TrackedUser>('users', { id: id, webToken: token, guilds: { $elemMatch: { id: serverID, owner: true } } })
  // Invalid
  if (!user) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Verify token
  try {
    // Verify token & payload
    var verify = jwt.verify(token, process.env.BOT_SECRET)
    // tslint:disable-next-line:no-console
    console.log('verify:', verify)
    return routed // PASS
  } catch (error) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }
}

export async function isAuthenticated(routed: WebRouted) {
  // User & Token from header
  const id = routed.req.header('id')
  const token = routed.req.header('webToken')
  // Get user from db to verify token
  const user = await routed.Bot.DB.get<TrackedUser>('users', { id: id, webToken: token })
  // Invalid
  if (!user) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Verify token
  try {
    // Verify token & payload
    var verify = jwt.verify(token, process.env.BOT_SECRET)
    // tslint:disable-next-line:no-console
    console.log('verify:', verify)
    return routed // PASS
  } catch (error) {
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }
}

export async function validAuthKey(routed: WebRouted) {
  // console.log('validAuthKey')
  const authKey = routed.req.header('AuthKey')
  // console.log('validAuthKey:authKey =>', authKey)
  // Make sure the AuthKey header is present
  if (!authKey || authKey.replace(' ', '') === '') {
    // console.log('AuthKey missing')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  const keysplit = authKey.split(':')
  const newLookupRegex = RegExp(`^${keysplit[0]}\\:${keysplit[1]}`)
  const authKeyStored = await routed.Bot.DB.get<AuthKey>('authkeys', { hash: newLookupRegex })
  // console.log('newLookupRegex', newLookupRegex)
  // console.log('authKeyStored', authKeyStored)

  // AuthKey is not in db
  if (!authKeyStored) {
    // console.log('AuthKey not in db')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Does match the user & id - now test if it's valild
  const nauthKeyStored = new AuthKey(authKeyStored)
  // console.log('nauthKeyStored', nauthKeyStored.hash, nauthKeyStored.test(authKey))
  if (nauthKeyStored.test(authKey)) return routed // PASS

  // Fallback - fail auth
  // console.log('fallback - auth fail')
  routed.res.send(401, 'Unauthorized')
  return // FAIL
}

////////////////////////////////////////////
// CK 3rd party ONLY
////////////////////////////////////////////

export async function validCKAuth(routed: WebRouted) {
  const sessionKey = routed.req.header('session')

  // If missing, fail
  if (!sessionKey) {
    console.log('validCKAuth => session key missing')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Verify sessionKey
  try {
    // Verify sessionKey & payload
    const verifiedSession = jwt.verify(sessionKey, process.env.BOT_SECRET)
    console.log('validCKAuth => verifiedSession:', verifiedSession)
  } catch (error) {
    console.log('validCKAuth => Session not valid!')
    routed.res.send(401, 'Unauthorized')
    return // FAIL
  }

  // Lookup ChastiKey user in DB by username and session
  const authKeyStored = await routed.Bot.DB.get<TrackedUser>('users', {
    'ChastiKey.extSession': sessionKey
  })

  // If no record, success
  if (authKeyStored) return routed

  // Fallback - fail auth
  console.log('validCKAuth => Session not found!')
  routed.res.send(401, 'Unauthorized')
  return // FAIL
}
