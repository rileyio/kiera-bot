// import { Task } from '#objects/task'
// import { Collections } from '@/db'
// import { ObjectId } from 'bson'
// import { ServerStatistic, StatisticsSetting } from '#objects/statistics'

// export class StatsCleaner extends Task {
//   public collection: Collections = 'stats-servers'

//   // Config for this task
//   run = this.fetch
//   schedule = '* * * * *'
//   settingPrefix = 'bot.task.stats.cleaner.schedule'

//   protected async fetch() {
//     this.Bot.Log.Scheduled.log('Running Stats Cleanup Query')
//     // Server stats to remove
//     var toRemoveUniqueStats = { entries: 0, servers: [] }

//     // Perform the scheduled task/job
//     try {
//       // Look for stats where they are: _id > 30 days & statsSettting = null|0
//       const distinctServers = await this.Bot.DB.distinct<string>('stats-servers', 'serverID')
//       const serversWithEnabledStats = await this.Bot.DB.getMultiple('stats-settings', {})

//       if (distinctServers) {
//         toRemoveUniqueStats.servers = [
//           ...distinctServers.filter((s) => {
//             const settingID = serversWithEnabledStats.findIndex((se) => se.serverID === s) > -1

//           })
//         ]

//         // ! Perform Delete
//         // const serverStatsDeleted = await this.Bot.DB.remove(
//         //   'stats-servers',
//         //   {
//         //     serverID: {
//         //       $in: distinctServers
//         //     }
//         //   },
//         //   { deleteOne: false }
//         // )

//         // // Look for stats where they are: matching a channel with stats disabled & _id > 30 days
//         // const channelStatsToDelete = await this.Bot.DB.aggregate<{ _id: string; serverID: string; channelID: string; userID: string; type: number }>('stats-servers', [
//         //   {
//         //     $match: { setting: 3 }
//         // },
//         // {
//         //     $lookup: {
//         //         from: 'stats-servers',
//         //         localField: 'channelID',
//         //         foreignField: 'channelID',
//         //         as: 'statsServer'
//         //     }
//         // },
//         // {
//         //     $unwind: {
//         //         path: '$statsServer',
//         //         preserveNullAndEmptyArrays: false
//         //     }
//         // },
//         // {
//         //     $project: {
//         //         _id: '$statsServer._id',
//         //         serverID: '$statsServer.serverID',
//         //         channelID: '$statsServer.channelID',
//         //         userID: '$statsServer.userID',
//         //         type: '$statsServer.type',
//         //         setting: 1
//         //     }
//         // },
//         // {
//         //     $match: { _id: { $lt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
//         // }
//         // ])

//         this.Bot.Log.Scheduled.log(`Stats Cleanup Task: Removing Stats for:
//       Servers:  ${Object.keys(toRemoveUniqueStats.servers).length}
//       Entries:  ${serverStatsDeleted}/${toRemoveUniqueStats.entries}
//       `)
//       } else {
//         this.Bot.Log.Scheduled.log(`Nothing needing to be cleaned up!`)
//       }

//       this.lastRun = Date.now()
//       return true
//     } catch (error) {
//       this.Bot.Log.Scheduled.error(`### Task:Error refreshing ${this.name}`, error)
//       // Set the last refresh for now to prevent repeated requests to the server
//       this.lastRun = Date.now()
//       return false
//     }
//   }

//   private async storeInDB(data: any) {
//     // try {
//     //   console.log(`Task:${this.name} => Store in DB`)
//     //   // Remove all old entires with non matching timestamps
//     //   await this.Bot.DB.remove(this.dbCollection, {}, { deleteOne: false })
//     //   // Update collection of Running Locks
//     //   await this.Bot.DB.addMany(this.dbCollection, data, {})
//     // } catch (error) {
//     //   console.log('### Task:DB store issue', error)
//     // }
//   }
// }
