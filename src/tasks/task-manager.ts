import * as Agenda from 'agenda'
import { Bot } from '@/index'
import { Task } from '@/objects/task'

export class TaskManager {
  protected Bot: Bot
  public registered: { [name: string]: Task } = {}
  // Background tasks v5+
  public Agenda = new Agenda({
    db: {
      address: process.env.DB_STRING
        ? process.env.DB_STRING
        : `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      collection: 'scheduled-jobs'
    }
  })

  public async start(bot: Bot, tasks: Array<Task>) {
    this.Bot = bot

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
