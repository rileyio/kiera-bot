import { ObjectID } from "bson";

export class TrackedMessage {
  public _id: ObjectID
  // Msg data
  public authorId: string
  public authorUsername: string
  public messageId: string
  public messageCreatedAt: number
  public channelId: string
  // Flags
  public flagAutoDelete: boolean = false
  public flagTrack: boolean = false
  // Storage Settings
  public storageKeepInChatFor: number
  public storageKeepInMemFor: number = Number(process.env.BOT_MESSAGE_CLEANUP_MEMORY_AGE)

  constructor(init: Partial<TrackedMessage>) {
    Object.assign(this, init);
  }
}