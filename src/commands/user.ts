import * as Middleware from '../middleware';
import * as Utils from '../utils/';
import { TrackedUser } from '../objects/user';
import { RouterRouted } from '../router/router';
import { AuthKey } from '../objects/authkey';
import { ExportRoutes } from '../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    commandTarget: 'author',
    controller: registerUser,
    example: '{{prefix}}register',
    name: 'register',
    validate: '/register:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: registerAPIAuthKey,
    example: '{{prefix}}user key new',
    name: 'user-api-authkey-create',
    validate: '/user:string/key:string/new:string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: destroyAPIAuthKey,
    example: '{{prefix}}user key destroy user:1:123abc',
    name: 'user-api-authkey-destroy',
    validate: '/user:string/key:string/destroy:string/authkey=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  }
)

export async function registerUser(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const isRegistered = await routed.bot.DB.verify<TrackedUser>('users', routed.message.author.id)

  if (!isRegistered) {
    // If not yet registered, store user in db
    const userID = await routed.bot.DB.add('users', new TrackedUser({
      id: routed.message.author.id,
      username: routed.message.author.username,
      discriminator: routed.message.author.discriminator,
      createdTimestamp: routed.message.author.createdTimestamp,
    }))
    const user = await routed.bot.DB.get<TrackedUser>('users', { _id: userID })
    const userAt = Utils.User.buildUserChatAt(user, userArgType)

    await routed.message.reply(`:white_check_mark: You're now registered! ^_^`)
    routed.bot.DEBUG_MSG_COMMAND.log(`!register ${userAt}`)
  }
  else {
    await routed.message.reply(`You're already registered! :wink:`)
    const userAt = Utils.User.buildUserChatAt(routed.message.author.id, userArgType)
    routed.bot.DEBUG_MSG_COMMAND.log(`!register ${userAt} - user already registered`)
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
       Note: if you need to destroy this you can run \`!user key destroy ${priKey}\``)

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

  await routed.message.author.send(
    `:exclamation: Your authkey \`${routed.v.o.authkey}\` is now deactivated!`)

  return true
}