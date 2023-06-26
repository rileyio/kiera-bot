import { Bot } from '#/index'
import { ObjectId } from 'bson'

export type AuditEntryType =
  | '<>'
  | 'discord.message.delete'
  | 'discord.user.join'
  | 'discord.user.leave'
  | 'discord.user.nickname'
  | 'api.oauth'
  | 'bot.command'
  | 'bot.maintenance'

export type AuditEntryWhere = 'Unknown' | 'discord' | 'api'

export class AuditEntry {
  public _id?: ObjectId
  public name: string
  public details = '<Should be filled with the command, actions detials or action performed>'
  public error: string
  public guild: { id: string; name: string; channel?: string }
  public owner = ''
  public runtime = 0
  public successful = false
  public timestamp: string = Date()
  public type: AuditEntryType = '<>'
  public where: AuditEntryWhere = 'Unknown'

  constructor(init: Partial<AuditEntry>) {
    Object.assign(this, init || {})
  }
}

export class Audit {
  private bot: Bot

  constructor(_bot: Bot) {
    this.bot = _bot
  }

  public async NewEntry(entry: Partial<AuditEntry>) {
    await this.bot.DB.add('audit-log', new AuditEntry(entry))
  }
}
