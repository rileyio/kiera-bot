import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'
import { TrackedChastiKeyLock, ChastiKeyVerifyDiscordID } from '@/objects/chastikey'
import { UserData } from 'chastikey.js/app/objects'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: debug,
  example: '{{prefix}}ck debug UsernameHere',
  name: 'ck-debug-username',
  validate: '/ck:string/debug:string/user=string',
  permissions: {
    defaultEnabled: true,
    serverOnly: false
  }
})

export async function debug(routed: RouterRouted) {
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  const asDiscordID = Number(routed.v.o.user) ? routed.v.o.user : 123

  const kieraUser = await routed.bot.DB.get<TrackedUser>('users', { $or: [{ 'ChastiKey.username': usernameRegex }, { id: routed.v.o.user }] })
  const ckUser = await routed.bot.DB.get<UserData>('ck-users', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober2019 = await routed.bot.DB.get<{ username: string; discordID: string }>('ck-locktober-2019', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober2020 = await routed.bot.DB.get<{ username: string; discordID: string }>('ck-locktober-2020', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
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
  response += `\nIs in ck-locktober Data (from CK): ${ckLocktober2019 ? true : false}\n`
  if (ckLocktober2019) {
    response += `  -> discordID           = ${ckLocktober2019.discordID}\n`
    response += `  -> username            = ${ckLocktober2019.username}\n`
  }
  response += `\nIs in ck-locktober Data (from CK): ${ckLocktober2020 ? true : false}\n`
  if (ckLocktober2020) {
    response += `  -> discordID           = ${ckLocktober2020.discordID}\n`
    response += `  -> username            = ${ckLocktober2020.username}\n`
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
