import { ChastiKeyVerifyDiscordID } from '@/objects/chastikey'
import { RoutedInteraction } from '@/router'

export async function user(routed: RoutedInteraction) {
  const username = routed.interaction.options.get('username')?.value as string
  const usernameRegex = new RegExp(`^${username}$`, 'i')
  const asDiscordID = Number(username) ? username : 123

  const kieraUser = await routed.bot.DB.get('users', { $or: [{ 'ChastiKey.username': usernameRegex }, { id: username }] })
  const ckUser = await routed.bot.DB.get('ck-users', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober2019 = await routed.bot.DB.get('ck-locktober-2019', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober2020 = await routed.bot.DB.get('ck-locktober-2020', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckLocktober2021 = await routed.bot.DB.get('ck-locktober-2021', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })
  const ckRunningLocks = await routed.bot.DB.getMultiple('ck-running-locks', { $or: [{ username: usernameRegex }, { discordID: asDiscordID }] })

  let verifyIDAPIResp: ChastiKeyVerifyDiscordID
  if (asDiscordID === 123) verifyIDAPIResp = await routed.bot.Service.ChastiKey.verifyCKAccountCheck({ username })
  if (asDiscordID !== 123) verifyIDAPIResp = await routed.bot.Service.ChastiKey.verifyCKAccountCheck({ discordID: asDiscordID })

  let response = `**ChastiKey User Debug**\n`
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
  response += `\nIs in ck-locktober Data (from CK): ${ckLocktober2021 ? true : false}\n`
  if (ckLocktober2021) {
    response += `  -> discordID           = ${ckLocktober2021.discordID}\n`
    response += `  -> username            = ${ckLocktober2021.username}\n`
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

  return await routed.reply(response, true)
}
