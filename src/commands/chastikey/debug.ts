import got = require('got');
import * as APIUrls from '../../api-urls';
import * as Middleware from '../../middleware';
import { ExportRoutes } from '../../router/routes-exporter';
import { RouterRouted } from '../../utils';
import { TrackedUser } from '../../objects/user';
import { TrackedChastiKeyUser, TrackedChastiKeyKeyholderStatistics, TrackedChastiKeyLockee, TrackedChastiKeyLock, ChastiKeyVerifyDiscordID } from '../../objects/chastikey';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: debug,
    example: '{{prefix}}ck debug UsernameHere',
    name: 'ck-debug-username',
    validate: '/ck:string/debug:string/user=string',
    middleware: [
      Middleware.isModerator
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    }
  }
)

export async function debug(routed: RouterRouted) {
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  const asDiscordID = Number(routed.v.o.user) ? Number(routed.v.o.user) : 123

  console.log('usernameRegex', usernameRegex)
  console.log('asDiscordID', asDiscordID)

  const kieraUser = await routed.bot.DB.get<TrackedUser>('users', { $or: [{ 'ChastiKey.username': usernameRegex }, { id: String(asDiscordID) }] })
  const ckUser = await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckKH = await routed.bot.DB.get<TrackedChastiKeyKeyholderStatistics>('ck-keyholders', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLockee = await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober = await routed.bot.DB.get<{ username: string, discordID: number }>('ck-locktober', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckRunningLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })

  var verifyIDAPIResp: got.Response<ChastiKeyVerifyDiscordID>
  if (asDiscordID === 123) verifyIDAPIResp = await got(`${APIUrls.ChastiKey.VerifyDiscordID}?username=${routed.v.o.user}`, { json: true })
  if (asDiscordID !== 123) verifyIDAPIResp = await got(`${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${asDiscordID}`, { json: true })
  var parsedVerifyDiscordID = new ChastiKeyVerifyDiscordID(verifyIDAPIResp.body)
  console.log(parsedVerifyDiscordID)

  var response = `**ChastiKey User Debug**\n`
  response += '```'
  response += `Is Registered with Kiera: ${kieraUser ? true : false}\n`
  if (kieraUser) {
    response += `  -> ChastiKey.username   = ${kieraUser.ChastiKey.username}\n`
    response += `  -> ChastiKey.isVerified = ${kieraUser.ChastiKey.isVerified}\n`
  }
  response += `\nIs in ck-users Data (from ChastiKey): ${ckUser ? true : false}\n`
  if (ckUser) {
    response += `  -> discordID            = ${ckUser.discordID}\n`
    response += `  -> username             = ${ckUser.username}\n`
    response += `  -> displayInStats       = ${ckUser.displayInStats === 1}\n`
    response += `  -> timestampLastActive  = ${ckUser.timestampLastActive}\n`
  }
  response += `\nIs in ck-keyholders Data (from ChastiKey): ${ckKH ? true : false}\n`
  if (ckKH) {
    response += `  -> discordID            = ${ckKH.discordID}\n`
    response += `  -> username             = ${ckKH.username}\n`
    response += `  -> displayInStats       = ${ckKH.displayInStats === 1}\n`
    response += `  -> dateFirstKeyheld     = ${ckKH.dateFirstKeyheld}\n`
  }
  response += `\nIs in ck-lockees Data (from ChastiKey): ${ckLockee ? true : false}\n`
  if (ckLockee) {
    response += `  -> discordID            = ${ckLockee.discordID}\n`
    response += `  -> username             = ${ckLockee.username}\n`
    response += `  -> joined               = ${ckLockee.joined}\n`
    response += `  -> timestampLastActive  = ${ckLockee.timestampLastActive}\n`
  }
  response += `\nIs in ck-locktober Data (from ChastiKey): ${ckLocktober ? true : false}\n`
  if (ckLocktober) {
    response += `  -> discordID            = ${ckLocktober.discordID}\n`
    response += `  -> username             = ${ckLocktober.username}\n`
  }
  response += `\nIs in ck-running-locks Data (from ChastiKey) (Count: ${ckRunningLocks.length}): ${ckRunningLocks.length > 0 ? true : false}\n`
  if (ckRunningLocks.length > 0) {
    ckRunningLocks.forEach((l, i) => {
      response += `  -> index                = ${i}\n`
      response += `  -> discordID            = ${l.discordID}\n`
      response += `  -> username             = ${l.username}\n`
      response += `  -> sharedLockName       = ${l.sharedLockName}\n`
      response += `  -> lockedBy             = ${l.lockedBy}\n`
      response += `  -> displayInStats       = ${l.displayInStats}\n`
    })
  }
  response += `\nAnything from Verify live check (from ChastiKey): ${verifyIDAPIResp.statusCode === 200 ? true : false}\n`
  if (verifyIDAPIResp.statusCode === 200) {
    response += `  -> discordID            = ${parsedVerifyDiscordID.discordID}\n`
    response += `  -> username             = ${parsedVerifyDiscordID.username}\n`
  }
  response += '```'

  await routed.message.channel.send(response)
  return true
}
