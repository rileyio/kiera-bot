export class TrackedMessage {
  // Msg data
  public author_id: string
  public author_username: string
  public message_id: string
  public message_createdAt: number
  public channel_id: string
  // Flags
  public flag_auto_delete: boolean = false
  public flag_track: boolean = false

  constructor(init: Partial<TrackedMessage>) {
    Object.assign(this, init);
  }
}