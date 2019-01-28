import { ObjectID } from 'bson';
import { MessageReaction } from 'discord.js';

export class TrackedMessage {
  public _id: ObjectID = new ObjectID()
  // Msg data
  public id: string
  public authorId: string
  public authorUsername: string
  public messageCreatedAt: number
  public channelId: string
  // React tracking
  public reactions: Array<TrackedMessageReaction | MessageReaction> = []
  // React routing
  public reactionRoute: string
  public reactionRoutes: Array<string> = [] // Not used at this time
  // Flags
  public flagAutoDelete: boolean = false
  public flagTrack: boolean = false
  // Storage Settings
  public storageKeepInChatFor: number
  public storageKeepInMemFor: number = Number(process.env.BOT_MESSAGE_CLEANUP_MEMORY_AGE)

  constructor(init: Partial<TrackedMessage>) {
    Object.assign(this, init);

    // Process incoming message reactions
    if (this.reactions.length > 0) this.parseReactions()
  }

  public update(updateType: 'reactions', data: any) {
    // console.log('update:', updateType, 'count:', data.length)
    if (updateType === 'reactions') {
      this.reactions = data
      return this.parseReactions()
    }
  }

  public parseReactions() {
    this.reactions = this.reactions.map(r => { return r = new TrackedMessageReaction(r) })
  }
}

export class TrackedMessageReaction {
  users: Array<string>
  count: number
  emoji: { id: string, name: string }

  constructor(init: Partial<TrackedMessageReaction> | MessageReaction) {
    // When incoming is just a raw Discord.MessageReaction
    if (Object(init).hasOwnProperty('message')) {
      const r = (<MessageReaction>init)
      this.users = r.users.array().map(u => u.id)
      this.count = r.count
      this.emoji = { id: r.emoji.id, name: r.emoji.name }
    }
    else {
      // When its from the db just merge the props
      Object.assign(this, init);
    }
  }
}