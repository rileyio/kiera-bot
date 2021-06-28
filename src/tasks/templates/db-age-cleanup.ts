import { Task } from '@/objects/task'
import { ObjectID } from 'mongodb'

export class DBAgeCleanup extends Task {
  // Config for this task
  run = this.process
  schedule = '30 seconds'
  settingPrefix = 'bot.task.status.message.rotate'

  protected async process() {
    // Perform the scheduled task/job
    try {
      // * Audit Log * //
      // ? Get Audit log entries > 30 days
      const auditLogIDs = (
        await this.Bot.DB.aggregate('audit-log', [
          {
            $match: { _id: { $lt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
          },
          {
            $sort: { _id: -1 }
          },
          {
            $project: { _id: 1 }
          }
        ])
      ).map((d: { _id: ObjectID }) => {
        return d._id
      })

      if (auditLogIDs.length) {
        this.Bot.Log.Scheduled.log(`[${this.name}][AuditLog] Cleaning up ${auditLogIDs.length} records that are >30 days old`)
        const auditLogIDsResults = await this.Bot.DB.remove('audit-log', { _id: { $in: auditLogIDs } }, { deleteOne: false })
        if (auditLogIDsResults) this.Bot.Log.Scheduled.log(`[${this.name}][AuditLog] Cleanup completed!`)
      }

      // * CK Stats * //
      // ? Get CK Compiled Stats entries > 30 days
      const ckHistorical = (
        await this.Bot.DB.aggregate('ck-stats-daily', [
          {
            $match: { _id: { $lt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
          },
          {
            $sort: { _id: -1 }
          },
          {
            $project: { _id: 1 }
          }
        ])
      ).map((d: { _id: ObjectID }) => {
        return d._id
      })

      if (ckHistorical.length) {
        this.Bot.Log.Scheduled.log(`[${this.name}][CK Hourly Stats] Cleaning up ${ckHistorical.length} records that are >30 days old`)
        const ckHistoricalResults = await this.Bot.DB.remove('ck-stats-daily', { _id: { $in: ckHistorical } }, { deleteOne: false })
        if (ckHistoricalResults) this.Bot.Log.Scheduled.log(`[${this.name}][CK Hourly Stats] Cleanup completed!`)
      }

      // * Decision Log * //
      // ? Get Audit log entries > 30 days
      const decisionLog = (
        await this.Bot.DB.aggregate('ck-stats-daily', [
          {
            $match: { _id: { $lt: ObjectID.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
          },
          {
            $sort: { _id: -1 }
          },
          {
            $project: { _id: 1 }
          }
        ])
      ).map((d: { _id: ObjectID }) => {
        return d._id
      })

      if (decisionLog.length) {
        this.Bot.Log.Scheduled.log(`[${this.name}][Decision Log] Cleaning up ${decisionLog.length} records that are >30 days old`)
        const decisionLogResults = await this.Bot.DB.remove('decision-log', { _id: { $in: decisionLog } }, { deleteOne: false })
        if (decisionLogResults) this.Bot.Log.Scheduled.log(`[${this.name}][Decision Log] Cleanup completed!`)
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
