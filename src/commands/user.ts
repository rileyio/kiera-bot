import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { TrackedUser } from '@/objects/user'
import { RouterRouted, ExportRoutes } from '@/router'
import { AuthKey } from '@/objects/authkey'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'User',
    controller: registerUser,
    description: 'Help.User.Register.Description',
    example: '{{prefix}}register',
    name: 'register',
    validate: '/register:string'
  },
  {
    type: 'message',
    category: 'User',
    controller: registerAPIAuthKey,
    example: '{{prefix}}user key new',
    name: 'user-api-authkey-create',
    validate: '/user:string/key:string/new:string',
    middleware: [Middleware.isUserRegistered],
    permissions: {
      restrictedTo: [
        '146439529824256000' // Emma#1366
      ]
    }
  },
  {
    type: 'message',
    category: 'User',
    controller: destroyAPIAuthKey,
    example: '{{prefix}}user key destroy user:1:123abc',
    name: 'user-api-authkey-destroy',
    validate: '/user:string/key:string/destroy:string/authkey=string',
    middleware: [Middleware.isUserRegistered],
    permissions: {
      restrictedTo: [
        '146439529824256000' // Emma#1366
      ]
    }
  },
  {
    type: 'message',
    category: 'User',
    description: 'Help.User.SetLocale.Description',
    controller: setUserLocale,
    example: '{{prefix}}user set locale fr',
    name: 'user-locale-set',
    validate: '/user:string/set:string/locale:string/name?=string',
    middleware: [Middleware.isUserRegistered]
  }
)

export async function registerUser(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const isRegistered = await routed.bot.DB.verify<TrackedUser>('users', routed.message.author.id)

  if (!isRegistered) {
    // If not yet registered, store user in db
    const userID = await routed.bot.DB.add(
      'users',
      new TrackedUser({
        id: routed.message.author.id,
        username: routed.message.author.username,
        discriminator: routed.message.author.discriminator
      })
    )
    const user = await routed.bot.DB.get<TrackedUser>('users', { _id: userID })
    const userAt = Utils.User.buildUserChatAt(user, userArgType)

    await routed.message.reply(`:white_check_mark: You're now registered! ^_^`)
    routed.bot.Log.Command.log(`!register ${userAt}`)
  } else {
    await routed.message.reply(`You're already registered! :wink:`)
    const userAt = Utils.User.buildUserChatAt(routed.message.author.id, userArgType)
    routed.bot.Log.Command.log(`!register ${userAt} - user already registered`)
  }

  return true
}

export async function registerAPIAuthKey(routed: RouterRouted) {
  const user = await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })
  const userKeyCount = await routed.bot.DB.getMultiple('authkeys', { uid: user._id })
  const authKey = new AuthKey({
    uid: user._id
  })
  const priKey = authKey.generate(user.username, userKeyCount.length + 1)

  await routed.bot.DB.add('authkeys', authKey)
  await routed.message.author.send(
    `:exclamation: This is your private key \`${priKey}\` **(DO NOT share this with anyone!)**
       Note: if you need to destroy this you can run \`!user key destroy ${priKey}\``
  )

  return true
}

export async function destroyAPIAuthKey(routed: RouterRouted) {
  // Make sure authkey exists and belongs to this user
  const user = await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })
  const keysplit = routed.v.o.authkey.split(':')
  const newLookupRegex = RegExp(`^${keysplit[0]}\\:${keysplit[1]}`)
  const authKey = await routed.bot.DB.get<AuthKey>('authkeys', { hash: newLookupRegex, uid: user._id })

  // Stop if no keys could be found
  if (!authKey) return false

  // Else: continue
  const updated = await routed.bot.DB.update<AuthKey>('authkeys', { _id: authKey._id }, { isActive: false })

  await routed.message.author.send(`:exclamation: Your authkey \`${routed.v.o.authkey}\` is now deactivated!`)

  return true
}

export async function setUserLocale(routed: RouterRouted) {
  // When no target locale is specified
  if (!routed.v.o.name) {
    await routed.message.reply(routed.$render('Locale.Error.NoneSpecified', { locales: routed.$locales() }))
    return true
  }

  // When the target locale does not exist
  if (!routed.$localeExists(routed.v.o.name)) {
    await routed.message.reply(routed.$render('Locale.Error.DoesNotExist', { locale: routed.v.o.name, locales: routed.$locales() }))
    return true
  }

  // When the target locale is already set
  if (routed.v.o.name.toLowerCase() === routed.user.locale.toLowerCase()) {
    await routed.message.reply(routed.$render('Locale.Info.AlreadySet', { locale: routed.v.o.name, contributors: routed.$localeContributors(routed.v.o.name) }))
    return true
  }

  // Set user locale
  await routed.bot.DB.update<TrackedUser>('users', { id: routed.author.id }, { $set: { locale: routed.v.o.name } }, { atomic: true })
  await routed.message.reply(routed.$render(routed.v.o.name, 'Locale.Success.Set', { locale: routed.v.o.name, contributors: routed.$localeContributors(routed.v.o.name) }))
  return true
}
