import * as Random from 'random'
import { TrackedBotSetting } from '@/objects/setting'
import { Task } from '@/objects/task'
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
      const storedStatus = new TrackedBotSetting(
        await this.Bot.DB.get<TrackedBotSetting>('settings', { key: 'bot.status.message' })
      )
      const hasStoredStatus = !!storedStatus._id && storedStatus.value

      // Available messages
      const options = [...this.stock]
      if (hasStoredStatus) options.push(hasStoredStatus.value)

      // Get a random message
      const random = Random.int(0, options.length - 1)
      const outcome = options[random]

      // Set the status
      await this.Bot.client.user.setPresence({
        activity: { name: sb(outcome, { size: this.Bot.client.guilds.cache.size }) || hasStoredStatus ? storedStatus.value : '' },
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
