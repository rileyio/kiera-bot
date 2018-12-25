import * as NEDB from 'nedb';
import * as Debug from "debug";
import { EventEmitter } from 'events';
import { TrackedMessage } from '../objects/message';
import { Bot } from '..';

// var DB_MSG_TRACKING = new NEDB({
//   filename: '../db/MSG_TRACKING.db',
//   autoload: true
// });

export class MsgTracker extends EventEmitter {
  private Bot: Bot
  private msgTrackingArr: Array<TrackedMessage> = []
  private msgProcesserRunning = false
  private msgCleanupInProgress = false
  private msgDeletionCleanupInProgress = false
  private msgProcesserInterval = Number(process.env.BOT_MESSAGE_CLEANUP_INTERVAL)
  private msgProcesserMemInterval = Number(process.env.BOT_MESSAGE_CLEANUP_MEMORY_AGE)
  private msgDeletionCleanupAge = Number(process.env.BOT_MESSAGE_CLEANUldiP_AGE)
  public DEBUG_MSG_TRACKER = Debug('ldi:MsgTracker');

  constructor(bot: Bot) {
    super()
    this.Bot = bot
    // Block duplicates - if that somehow were possible......
    if (!this.msgProcesserRunning) {
      this.DEBUG_MSG_TRACKER('starting MsgTracker...')
      // Memory cleanup, remove old messages tracked beyond TrackedMessage.storage_keep_for age
      setInterval(() => this.trackedMsgCleanup(), this.msgProcesserMemInterval)
      // Scan msgArray for messages with TrackedMessage.flag_auto_delete === true beyond
      // their defined period
      setInterval(() => this.trackedMsgDeletionCleanup(), this.msgProcesserInterval)
    }
  }

  trackedMsgCleanup() {
    // Block duplicate cleanups if a previous is still running
    if (this.msgCleanupInProgress) return
    // Continue with cleanup
    const now = Date.now()

    // Check for any messages past the memory threshold
    var toCleanupArray = this.msgTrackingArr.filter(msg => {
      // Calculate message age
      const age = Math.round(now - msg.message_createdAt)
      if (age > msg.storage_keep_in_mem_for) {
        this.Bot.DEBUG_MSG_SCHEDULED(`mem cleanup => id:${msg.message_id} createdAt:${msg.message_createdAt} age:${age}`)
        return true
      }
    })

    // Process cleanup
    if (toCleanupArray.length > 0) {
      for (let index = 0; index < toCleanupArray.length; index++) {
        const msgToClean = toCleanupArray[index];
        this.removeMemTrackedMsg(msgToClean.message_id, true)
      }
      // end cleanup
      this.msgCleanupInProgress = false
    }
  }

  trackedMsgDeletionCleanup() {
    // Block duplicate cleanups if a previous is still running
    if (this.msgDeletionCleanupInProgress) return
    // Continue with cleanup
    const now = Date.now()
    // Check for any messages past 10 seconds old
    var toCleanupArray = this.msgTrackingArr.filter(msg => {
      // Skip if TrackedMessage.flag_auto_delete === false
      if (!msg.flag_auto_delete) return;

      // Calculate message age
      const age = Math.round(now - msg.message_createdAt)
      const deleteAfter = msg.storage_keep_in_chat_for > 0
        ? msg.storage_keep_in_chat_for
        : this.msgDeletionCleanupAge
      // If age of message meets the criteria (First check the TrackedMessage retain else fallback to .env)
      if (age > deleteAfter) {
        this.DEBUG_MSG_TRACKER(`cleanup => id:${msg.message_id} createdAt:${msg.message_createdAt} age:${age}`)
        return true
      }
    })

    // Process cleanup
    if (toCleanupArray.length > 0) {
      for (let index = 0; index < toCleanupArray.length; index++) {
        const msgToClean = toCleanupArray[index];
        this.removeTrackedMsg(msgToClean.message_id, msgToClean.channel_id)
      }
      // end cleanup
      this.msgDeletionCleanupInProgress = false
    }
  }

  trackMsg(msg: TrackedMessage) {
    // Track message in array
    this.msgTrackingArr.push(msg)
  }

  removeTrackedMsg(messageId: string, channelId: string) {
    // Trigger delete of message for keeping chat clean
    this.emit('msg-tracker--remove-msg', messageId, channelId)
    this.removeMemTrackedMsg(messageId)
  }

  removeMemTrackedMsg(messageId: string, oldCleanup?: boolean) {
    // Find msg id's index
    const foundMsgIndex = this.msgTrackingArr.findIndex(msg => msg.message_id === messageId)
    // Remove msg from tracking
    this.msgTrackingArr.splice(foundMsgIndex, 1)
    if (oldCleanup) this.Bot.DEBUG_MSG_SCHEDULED(`deleted old message in mem id:${messageId}`)
  }
}

// export function trackNewMsg(msg: TrackedMessage, debug: Debug.IDebugger) {
//   DB_MSG_TRACKING.insert<TrackedMessage>(msg)
// }