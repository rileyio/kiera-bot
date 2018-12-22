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
  // Storage Settings
  public storage_keep_in_chat_for: number
  public storage_keep_in_mem_for: number

  constructor(init: Partial<TrackedMessage>) {
    Object.assign(this, init);
  }
}