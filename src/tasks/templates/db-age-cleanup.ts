import { ObjectId } from 'mongodb'
import { Task } from '../task'

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
            $match: { _id: { $lt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
          },
          {
            $sort: { _id: -1 }
          },
          {
            $project: { _id: 1 }
          }
        ])
      ).map((d: { _id: ObjectId }) => {
        return d._id
      })

      if (auditLogIDs.length) {
        this.Bot.Log.Scheduled.log(`[${this.name}][AuditLog] Cleaning up ${auditLogIDs.length} records that are >30 days old`)
        const auditLogIDsResults = await this.Bot.DB.remove('audit-log', { _id: { $in: auditLogIDs } }, { deleteOne: false })
        if (auditLogIDsResults) this.Bot.Log.Scheduled.log(`[${this.name}][AuditLog] Cleanup completed!`)
      }

      // * Decision Log * //
      // ? Get Audit log entries > 30 days
      const decisionLog = (
        await this.Bot.DB.aggregate('decision-log', [
          {
            $match: { _id: { $lt: ObjectId.createFromTime(new Date().setDate(new Date().getDate() - 30) / 1000) } }
          },
          {
            $sort: { _id: -1 }
          },
          {
            $project: { _id: 1 }
          }
        ])
      ).map((d: { _id: ObjectId }) => {
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
