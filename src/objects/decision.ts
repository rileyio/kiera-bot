import { ObjectID } from 'bson';

export class TrackedDecision {
  public readonly _id: ObjectID = new ObjectID()
  public name: string = ''
  public options: Array<TrackedDecisionOption> = []
  public owner: ObjectID

  constructor(init: Partial<TrackedDecision>) {
    Object.assign(this, init)
    this.options = this.options.map(o => new TrackedDecisionOption(o))
  }
}

export class TrackedDecisionOption {
  public _id: ObjectID = new ObjectID()
  public text: string

  constructor(init: Partial<TrackedDecisionOption>) {
    Object.assign(this, init)
  }
}