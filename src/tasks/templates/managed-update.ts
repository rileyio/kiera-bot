import { ManagedChannel } from '#objects/managed'
import { Task } from '../task.ts'
import { VoiceChannel } from 'discord.js'
import { calculateHumanTimeDDHHMM } from '#utils'
import moment from 'moment'

export class ManagedUpdate extends Task {
  // Config for this task
  run = this.process
  schedule = '* * * * *'
  settingPrefix = 'bot.task.managed.channel.updater'

  protected async process() {
    // Perform the scheduled task
    try {
      const managedChannels = (await this.Bot.DB.getMultiple('managed', { enabled: true })) as Array<ManagedChannel>

      if (managedChannels.length) {
        //this.Bot.Log.Scheduled.verbose(`${moment().toISOString()} [${this.name}] Updating ${managedChannels.length} managed channels...`)
        for (let index = 0; index < managedChannels.length; index++) {
          const managed = managedChannels[index]

          try {
            // Too soon to update
            if (moment.unix(managed.updated / 1000).isAfter(moment.utc().subtract(5, 'minutes'))) {
              // this.Bot.Log.Scheduled.verbose(
              //   `[${this.name}] Skipping ${managed.channelID} as its too soon to update. (last updated: ${moment.unix(managed.updated / 1000).fromNow()})`
              // )
              continue
            }

            const channel = (await this.Bot.client.channels.fetch(managed.channelID)) as VoiceChannel
            const newValue = `${managed.name}`.replace('{#}', calculateHumanTimeDDHHMM(managed.value / 1000, { dropMinutes: true, dropZeros: true }))
            if (channel && managed.type === 'countdown') {
              if (channel.name !== newValue) {
                // Test to see if value has changed
                await channel.edit({ name: newValue })
                await this.Bot.DB.update('managed', { channelID: managed.channelID }, { updated: moment.now() })
                this.Bot.Log.Scheduled.verbose(`[${this.name}] Updated ${managed.name} to ${newValue}`)
                continue
              }
              // When Value has not changed
              if (channel.name === newValue) {
                continue
                // this.Bot.Log.Scheduled.verbose(
                //   `[${this.name}] Channel ${managed.channelID} is already up to date. (last updated: ${moment.unix(managed.updated / 1000).fromNow()})`
                // )
              }
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
