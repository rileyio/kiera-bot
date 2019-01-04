import { TrackedMessageReaction } from '../objects/message';

export namespace React {
  export function filter(limitTo: Array<string>, reacts: Array<TrackedMessageReaction>) {
    return reacts.filter(r => {
      return limitTo.findIndex(lr => lr === r.emoji.name) > -1
    })
  }

  export function toInt(mapping: { [emoji: string]: number }, reacts: Array<TrackedMessageReaction>) {
    return reacts.map(r => mapping[r.emoji.name])
  }
}