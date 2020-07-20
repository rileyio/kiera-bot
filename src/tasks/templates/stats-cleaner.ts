import { Task } from '@/objects/task'
import { Collections } from '@/db'
import { ObjectID } from 'bson'
import { ServerStatistic, StatisticsSetting } from '@/objects/statistics'

export class StatsCleaner extends Task {
  public collection: Collections = 'stats-servers'

  // Config for this task
  run = this.fetch
  schedule = '0 * * * *'
  settingPrefix = 'bot.task.stats.cleaner.schedule'

  protected async fetch() {
    console.log('Running Stats Cleanup Query')
    // Server stats to remove
    var toRemoveUniqueStats = { entries: 0, servers: {}, channels: {}, users: {} }

    // Perform the scheduled task/job
    try {
      // Look for stats where they are: _id > 30 days & statsSettting = null|0
      const serverStatsToDelete = await this.Bot.DB.aggregate<{ _id: string; serverID: string; channelID: string; userID: string; type: number }>('stats-servers', [
        {
          $lookup: {
            from: 'stats-settings',
            localField: 'serverID',
            foreignField: 'serverID',
            as: 'statsSetting'
          }
        },
        {
          $unwind: {
            path: '$statsSetting',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            serverID: 1,
            channelID: 1,
            userID: 1,
            setting: '$statsSetting.setting'
          }
        },
        {
          $match: {
            $or: [{ setting: null }, { setting: 0 }],
            _id: { $lt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) }
          }
        }
      ])

      for (let index = 0; index < serverStatsToDelete.length; index++) {
        const stat = serverStatsToDelete[index]

        // Track Unique Server stats being removed
        if (!toRemoveUniqueStats[stat.serverID]) toRemoveUniqueStats.servers[stat.serverID] = 1
        else toRemoveUniqueStats.servers[stat.serverID] += 1

        // Track Unique Channel stats being removed
        if (!toRemoveUniqueStats[stat.channelID]) toRemoveUniqueStats.channels[stat.channelID] = 1
        else toRemoveUniqueStats.channels[stat.channelID] += 1

        // Track Unique User stats being removed
        if (!toRemoveUniqueStats[stat.userID]) toRemoveUniqueStats.users[stat.userID] = 1
        else toRemoveUniqueStats.users[stat.userID] += 1

        toRemoveUniqueStats.entries++
      }

      // ! Perform Delete
      const serverStatsDeleted = await this.Bot.DB.remove(
        'stats-servers',
        serverStatsToDelete.map((s) => s._id),
        { deleteOne: false }
      )

      // // Look for stats where they are: matching a channel with stats disabled & _id > 30 days
      // const channelStatsToDelete = await this.Bot.DB.aggregate<{ _id: string; serverID: string; channelID: string; userID: string; type: number }>('stats-servers', [
      //   {
      //     $match: { setting: 3 }
      // },
      // {
      //     $lookup: {
      //         from: 'stats-servers',
      //         localField: 'channelID',
      //         foreignField: 'channelID',
      //         as: 'statsServer'
      //     }
      // },
      // {
      //     $unwind: {
      //         path: '$statsServer',
      //         preserveNullAndEmptyArrays: false
      //     }
      // },
      // {
      //     $project: {
      //         _id: '$statsServer._id',
      //         serverID: '$statsServer.serverID',
      //         channelID: '$statsServer.channelID',
      //         userID: '$statsServer.userID',
      //         type: '$statsServer.type',
      //         setting: 1
      //     }
      // },
      // {
      //     $match: { _id: { $lt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
      // }
      // ])

      console.log(`Stats Cleanup Task: Removing Stats for:
      Servers:  ${Object.keys(toRemoveUniqueStats.servers).length}
      Channels: ${Object.keys(toRemoveUniqueStats.channels).length}
      Users:    ${Object.keys(toRemoveUniqueStats.users).length}

      Entries:  ${serverStatsDeleted}/${toRemoveUniqueStats.entries}
      `)

      this.lastRun = Date.now()
      return true
    } catch (error) {
      console.log(`### Task:Error refreshing ${this.name}`, error)
      // Set the last refresh for now to prevent repeated requests to the server
      this.lastRun = Date.now()
      return false
    }
  }

  private async storeInDB(data: any) {
    // try {
    //   console.log(`Task:${this.name} => Store in DB`)
    //   // Remove all old entires with non matching timestamps
    //   await this.Bot.DB.remove(this.dbCollection, {}, { deleteOne: false })
    //   // Update collection of Running Locks
    //   await this.Bot.DB.addMany(this.dbCollection, data, {})
    // } catch (error) {
    //   console.log('### Task:DB store issue', error)
    // }
  }
}
