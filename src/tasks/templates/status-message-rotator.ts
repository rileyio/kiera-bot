import * as Random from 'random'

import { Task } from '@/objects/task'
import { TrackedBotSetting } from '@/objects/setting'
import { sb } from '@/utils'

export class StatusMessageRotator extends Task {
  private stock = ['{{size}} Servers', 'kierabot.xyz']

  // Config for this task
  run = this.process
  schedule = '30 seconds'
  settingPrefix = 'bot.task.status.message.rotate'

  protected async process() {
    // Perform the scheduled task/job
    try {
      // Get any stored status message(s)
      const storedStatus = new TrackedBotSetting(await this.Bot.DB.get('settings', { key: 'bot.status.message' }))
      const hasStoredStatus = !!storedStatus._id && storedStatus.value

      // Available messages
      const options = [...this.stock]
      if (hasStoredStatus) options.push(hasStoredStatus.value)

      // Get a random message
      const random = Random.int(0, options.length - 1)
      const outcome = options[random]

      // console.log('sb', sb(outcome, { size: this.Bot.client.guilds.cache.size }) || hasStoredStatus ? storedStatus.value : '')
      // console.log('outcome', outcome)
      // console.log('this.Bot.client.guilds.cache.size', this.Bot.client.guilds.cache.size)
      // console.log('hasStoredStatus', hasStoredStatus)
      // console.log('storedStatus.value', storedStatus.value)
      // console.log('>>>>', hasStoredStatus ? storedStatus.value : '' || sb(outcome, { size: this.Bot.client.guilds.cache.size }))

      // Set the status
      this.Bot.client.user.setPresence({
        activities: [{ name: hasStoredStatus ? storedStatus.value : '' || sb(outcome, { size: this.Bot.client.guilds.cache.size }) }],
        status: 'online'
      })

      this.lastRun = Date.now()
      return true
    } catch (error) {
      console.log(error)
      this.lastRun = Date.now()
      return false
    }
  }
}
