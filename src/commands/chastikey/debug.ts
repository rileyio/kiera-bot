import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedChastiKeyLock, ChastiKeyVerifyDiscordID } from '@/objects/chastikey'
import { UserData } from 'chastikey.js/app/objects'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  commandTarget: 'author',
  controller: debug,
  example: '{{prefix}}ck debug UsernameHere',
  name: 'ck-debug-username',
  validate: '/ck:string/debug:string/user=string',
  middleware: [Middleware.isModerator],
  permissions: {
    defaultEnabled: true,
    serverOnly: true,
    restrictedTo: [
      '473856245166506014', // KevinCross#0001
      '146439529824256000' // Emma#1366
    ]
  }
})

export async function debug(routed: RouterRouted) {
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  const asDiscordID = Number(routed.v.o.user) ? routed.v.o.user : 123

  const kieraUser = await routed.bot.DB.get<TrackedUser>('users', { $or: [{ 'ChastiKey.username': usernameRegex }, { id: routed.v.o.user }] })
  const ckUser = await routed.bot.DB.get<UserData>('ck-users', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober = await routed.bot.DB.get<{ username: string; discordID: string }>('ck-locktober', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckRunningLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })

  var verifyIDAPIResp: ChastiKeyVerifyDiscordID
  if (asDiscordID === 123) verifyIDAPIResp = await routed.bot.Service.ChastiKey.verifyCKAccountCheck({ username: routed.v.o.user })
  if (asDiscordID !== 123) verifyIDAPIResp = await routed.bot.Service.ChastiKey.verifyCKAccountCheck({ discordID: asDiscordID })

  var response = `**ChastiKey User Debug**\n`
  response += '```'
  response += `Is Registered with Kiera: ${kieraUser ? true : false}\n`
  if (kieraUser) {
    response += `  -> id                  = ${kieraUser.id}\n`
    response += `  -> CK.username         = ${kieraUser.ChastiKey.username}\n`
    response += `  -> CK.isVerified       = ${kieraUser.ChastiKey.isVerified}\n`
  }
  response += `\nIs in ck-users Data (from CK): ${ckUser ? true : false}\n`
  if (ckUser) {
    response += `  -> discordID           = ${ckUser.discordID}\n`
    response += `  -> username            = ${ckUser.username}\n`
    response += `  -> timestampLastActive = ${ckUser.timestampLastActive}\n`
    response += `  -> dateFirstKeyheld    = ${ckUser.dateFirstKeyheld}\n`
  }
  response += `\nIs in ck-locktober Data (from CK): ${ckLocktober ? true : false}\n`
  if (ckLocktober) {
    response += `  -> discordID           = ${ckLocktober.discordID}\n`
    response += `  -> username            = ${ckLocktober.username}\n`
  }
  response += `\nIs in ck-running-locks Data (from CK) (Count: ${ckRunningLocks.length}): ${ckRunningLocks.length > 0 ? true : false}\n`
  if (ckRunningLocks.length > 0) {
    ckRunningLocks.forEach((l, i) => {
      response += `  -> index               = ${i}\n`
      response += `  -> discordID           = ${l.discordID}\n`
      response += `  -> username            = ${l.username}\n`
    })
  }
  response += `\nAnything from Verify live check (from CK): ${verifyIDAPIResp.status === 200 ? true : false}\n`
  if (verifyIDAPIResp.status === 200) {
    response += `  -> discordID           = ${verifyIDAPIResp.discordID}\n`
    response += `  -> username            = ${verifyIDAPIResp.username}\n`
  }
  response += '```'

  await routed.message.channel.send(response)
  return true
}
