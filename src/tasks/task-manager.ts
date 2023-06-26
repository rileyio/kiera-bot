import Agenda from 'agenda'

import { Bot } from '#/index'
import { Task } from '#objects/task'
import { Secrets } from '#utils'

export class TaskManager {
  protected Bot: Bot
  public registered: { [name: string]: Task } = {}
  // Background tasks v5+
  public Agenda: Agenda

  constructor(bot: Bot) {
    this.Bot = bot
    // bot.Log.Bot.log('db url', Secrets.read('DB_STRING', this.Bot.Log.Bot))
    this.Agenda = new Agenda({
      db: {
        address: Secrets.read('DB_STRING', this.Bot.Log.Bot),
        collection: 'scheduled-jobs'
      }
    })
  }

  public async start(tasks: Array<Task>) {
    // Start Agenda Queue
    await this.Agenda.start()

    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      this.register(task)
    }
  }

  public register(task: Task) {
    // Assign Bot & Agenda to task
    task.Agenda = this.Agenda
    task.Bot = this.Bot

    // Trigger Agenda setup if defined
    task.setupAgenda()

    this.registered[task.name] = task
  }
}
