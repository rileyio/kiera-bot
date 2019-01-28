import * as Utils from '../../utils';
import { RouterRouted } from '../../utils';
import { TrackedBotSetting } from '../../objects/setting';
import { ChastiKeyAPIFetchAndStore } from '../../tasks/templates/ck-api-fetch-store';

export async function forceStatsReload(routed: RouterRouted) {
  await routed.message.channel.send(Utils.sb(Utils.en.chastikey.adminRefreshStats, {
    seconds: ((routed.v.o.seconds || 5000) / 1000)
  }))

  // Update in db
  await routed.bot.DB.update<TrackedBotSetting>('settings',
    { key: /^bot\.task\.chastikey\.api\.fetch/i },
    { lastUpdatd: Date.now(), value: 0 },
    { updateOne: false })

  // Update in TaskManager
  Object.keys(routed.bot.Task.registered).forEach(taskName => {
    if (!/^ChastiKeyAPI/.test(taskName)) return // skip this task
    (<ChastiKeyAPIFetchAndStore>routed.bot.Task.registered[taskName]).previousRefresh = 0
  })
}