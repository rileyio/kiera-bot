import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  commandTarget: 'argument',
  controller: forceStatsReload,
  example: '{{prefix}}admin ck stats refresh',
  name: 'admin-ck-stats-stats',
  permissions: {
    defaultEnabled: false,
    serverAdminOnly: true,
    restrictedTo: [
      '473856245166506014', // KevinCross#0001
      '146439529824256000' // Emma#1366
    ]
  },
  validate: '/admin:string/ck:string/stats:string/refresh:string'
})

/**
 * Trigger a reload when the next task interval runs
 * @export
 * @param {RouterRouted} routed
 */
export async function forceStatsReload(routed: RouterRouted) {
  await routed.message.reply(routed.$render('Generic.Warn.CommandUnderMaintenance'))

  return true

  await routed.message.channel.send(
    routed.$render('ChastiKey.Admin.RefreshTriggered', {
      seconds: (routed.v.o.seconds || 5000) / 1000
    })
  )

  // Update in db
  // await routed.bot.DB.update<TrackedBotSetting>('settings', { key: /^bot\.task\.chastikey\.api\.fetch/i }, { lastUpdatd: Date.now(), value: 0 }, { updateOne: false })

  // Successful end
  return true
}
