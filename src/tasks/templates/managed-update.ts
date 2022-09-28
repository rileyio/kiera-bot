import * as moment from 'moment'

import { ManagedChannel } from '@/objects/managed'
import { Task } from '@/objects/task'
import { VoiceChannel } from 'discord.js'

export class ManagedUpdate extends Task {
  // Config for this task
  run = this.process
  schedule = '1 minute'
  settingPrefix = 'bot.task.managed.channel.updater'

  protected async process() {
    // Perform the scheduled task
    try {
      const managedChannels = (await this.Bot.DB.getMultiple('managed', { enabled: true })) as Array<ManagedChannel>

      if (managedChannels.length) {
        this.Bot.Log.Scheduled.verbose(`[${this.name}] Updating ${managedChannels.length} managed channels...`)
        for (let index = 0; index < managedChannels.length; index++) {
          const managed = managedChannels[index]

          try {
            const channel = (await this.Bot.client.channels.fetch(managed.channelID)) as VoiceChannel
            const newValue = `${managed.name}`.replace('{#}', moment.unix(managed.value).fromNow().toString())
            if (channel && managed.type === 'countdown') {
              // Too soon to update
              if (moment.unix(managed.updated).isAfter(moment.utc().subtract(5, 'minutes'))) {
                this.Bot.Log.Scheduled.verbose(
                  `[${this.name}] Skipping ${managed.channelID} as its too soon to update. (last updated: ${moment.unix(managed.updated).fromNow()})`
                )
                continue
              }
              if (channel.name !== newValue) {
                // Test to see if value has changed
                await channel.edit({ name: newValue })
                await this.Bot.DB.update('managed', { channelID: managed.channelID }, { updated: moment.now() })
                this.Bot.Log.Scheduled.verbose(`[${this.name}] Updated ${managed.name} to ${newValue}`)
                continue
              }
              // When Value has not changed
              if (channel.name === newValue) this.Bot.Log.Scheduled.verbose(`[${this.name}] Channel ${managed.channelID} is already up to date. (last updated: ${moment.unix(managed.updated).fromNow()})`)
            }
          } catch (error) {
            this.Bot.Log.Scheduled.error(`[${this.name}] Error updating managed channel ${managed.channelID}: ${error}`)
            // Disable the managed channel
            if ((error.message as string).includes('Unknown Channel')) {
              await this.Bot.DB.update('managed', { channelID: managed.channelID }, { enabled: false })
              this.Bot.Log.Scheduled.verbose(`[${this.name}] Disabled managed channel ${managed.channelID}`)
            }
          }
        }
      }

      this.lastRun = Date.now()
      return true
    } catch (error) {
      console.log(error)
      this.lastRun = Date.now()
      return false
    }
  }
}
