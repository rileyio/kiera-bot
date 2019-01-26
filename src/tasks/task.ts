import { Bot } from '..';

export class Task {
  /**
   * Set the target method to run when the task is called
   * @type {string}
   * @memberof Task
   */
  public run: () => Promise<boolean>
  public frequency: number
  public isAsync: boolean = false
  public name: string
}

export class TaskManager {
  public registered: { [name: string]: Task } = {}
  public isTaskRunnerRunning: boolean = false
  public isTaskRunnerProcessing: boolean = false
  public _taskRunner: NodeJS.Timer

  public start() {
    this.taskRunner()
  }

  public register(task: Task) {
    this.registered[task.name] = task
    // tslint:disable-next-line:no-console
    console.log('Task:Registered:', task)
  }

  private taskRunner() {
    if (this.isTaskRunnerRunning) return // Block dup
    this._taskRunner = setInterval(async () => {
      // Block a task runner refresh if its still running
      if (this.isTaskRunnerProcessing) return
      this.isTaskRunnerProcessing = true
      // Checking tasks to run
      for (const key in this.registered) {
        if (this.registered.hasOwnProperty(key)) {
          const task = this.registered[key];
          // Check if task if past due to run
          // if ((Date.now))
          await task.run()
        }
      }

      this.isTaskRunnerProcessing = false
    }, 5000)
  }
}

export * from './chastikey'