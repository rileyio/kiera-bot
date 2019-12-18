import { Bot } from '@/index'
import { Task } from '@/objects/task'

export class TaskManager {
  protected Bot: Bot
  public registered: { [name: string]: Task } = {}
  public isTaskRunnerRunning: boolean = false
  public isTaskRunnerProcessing: boolean = false
  public _taskRunner: NodeJS.Timer

  public start(bot: Bot, tasks: Array<Task>) {
    this.Bot = bot
    this.taskRunner()
    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      this.register(task)
    }
  }

  public register(task: Task) {
    this.registered[task.name] = task
    // tslint:disable-next-line:no-console
    // console.log('Task:Registered:', task)
  }

  private taskRunner() {
    if (this.isTaskRunnerRunning) return // Block dup
    this._taskRunner = setInterval(async () => {
      // Block a task runner refresh if its still running
      if (this.isTaskRunnerProcessing) return
      this.isTaskRunnerProcessing = true
      // Checking tasks to run
      for (const key in this.registered) {
        try {
          const task = this.registered[key]
          // Check if task if past due to run
          await task.run()
        } catch (error) {
          // tslint:disable-next-line:no-console
          console.log(`Task:Manager => ${key} failed`, error)
        }

        this.registered[key].lastRun = Date.now()
      }

      this.isTaskRunnerProcessing = false
    }, 5000)
  }
}
