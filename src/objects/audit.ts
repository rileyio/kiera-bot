export type AuditEntryType = '<>'
  | 'discord.message.delete'
  | 'discord.user.join'
  | 'discord.user.leave'
  | 'discord.user.nickname'
  | 'api.oauth'
  | 'bot.command'
  | 'bot.maintenance'

export type AuditEntryWhere = 'Unknown' | 'Discord' | 'API'

export class AuditEntry {
  public name: string
  public details: string = '<Should be filled with the command, actions detials or action performed>'
  public error: string
  public guild: { id: string, name: string, channel?: string }
  public owner: string = ''
  public runtime: number = 0
  public successful: boolean = false
  public timestamp: string = Date()
  public type: AuditEntryType = '<>'
  public where: AuditEntryWhere = 'Unknown'

  constructor(init: Partial<AuditEntry>) {
    Object.assign(this, init || {})
  }
}