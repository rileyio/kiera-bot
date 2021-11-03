import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { TrackedUser } from '@/objects/user/'
import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'User',
  controller: setUserLocale,
  description: 'Help.User.SetLocale.Description',
  example: '{{prefix}}user set locale fr',
  name: 'user-locale-set',
  validate: '/user:string/set:string/locale:string/name?=string',
  middleware: [Middleware.isUserRegistered]
})

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
