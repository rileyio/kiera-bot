import * as jwt from 'jsonwebtoken';
import { WebRouted } from '../web-router';
import { AuthKey } from '../../objects/authkey';
import { TrackedUser } from '../../objects/user';

export async function isAuthenticated(routed: WebRouted) {
  // User & Token from header
  const id = routed.req.header('id');
  const token = routed.req.header('webToken');
  // Get user from db to verify token
  const user = await routed.Bot.DB.get<TrackedUser>('users', { id: id, webToken: token })
  // Invalid
  if (!user) {
    routed.res.send(401, 'Unauthorized');
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
    routed.res.send(401, 'Unauthorized');
    return // FAIL
  }
}

export async function validAuthKey(routed: WebRouted) {
  // console.log('validAuthKey')
  const authKey = routed.req.header('AuthKey');
  // console.log('validAuthKey:authKey =>', authKey)
  // Make sure the AuthKey header is present
  if (!authKey || authKey.replace(' ', '') === '') {
    // console.log('AuthKey missing')
    routed.res.send(401, 'Unauthorized');
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
    routed.res.send(401, 'Unauthorized');
    return // FAIL
  }

  // Does match the user & id - now test if it's valild
  const nauthKeyStored = new AuthKey(authKeyStored)
  // console.log('nauthKeyStored', nauthKeyStored.hash, nauthKeyStored.test(authKey))
  if (nauthKeyStored.test(authKey)) return routed // PASS

  // Fallback - fail auth
  // console.log('fallback - auth fail')
  routed.res.send(401, 'Unauthorized');
  return // FAIL
}