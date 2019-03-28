import { Bot } from '.';
import { AuditEntry } from './objects/audit';

export class Audit {
  private bot: Bot

  constructor(_bot: Bot) {
    this.bot = _bot
  }

  public async NewEntry(entry: Partial<AuditEntry>) {
    await this.bot.DB.add<AuditEntry>('audit-log', new AuditEntry(entry))
  }
}