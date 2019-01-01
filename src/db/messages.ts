import * as Debug from 'debug';
import { EventEmitter } from 'events';
import { TrackedMessage } from '../objects/message';
import { Bot } from '..';
import { TextChannel } from 'discord.js';

export class MsgTracker {
  private Bot: Bot
  private msgTrackingArr: Array<TrackedMessage> = []
  private msgProcesserRunning = false
  private msgCleanupInProgress = false
  private msgDeletionCleanupInProgress = false
  private msgProcesserInterval = Number(process.env.BOT_MESSAGE_CLEANUP_INTERVAL)
  private msgProcesserMemInterval = Number(process.env.BOT_MESSAGE_CLEANUP_MEMORY_AGE)
  private msgDeletionCleanupAge = Number(process.env.BOT_MESSAGE_CLEANUldiP_AGE)
  private msgDeletionPreviousCount = 0
  public DEBUG_MSG_TRACKER = Debug('ldi:MsgTracker');

  constructor(bot: Bot) {
    this.Bot = bot
    // Block duplicates - if that somehow were possible......
    if (!this.msgProcesserRunning) {
      this.DEBUG_MSG_TRACKER('starting MsgTracker...')
      // Memory cleanup, remove old messages tracked beyond TrackedMessage.storage_keep_for age
      setInterval(() => this.trackedMsgCleanup(), this.msgProcesserMemInterval)
      // Scan msgArray for messages with TrackedMessage.flagAutoDelete === true beyond
      // their defined period
      setInterval(() => this.trackedMsgDeletionCleanup(), this.msgProcesserInterval)
    }
  }

  public async trackMsg(msg: TrackedMessage) {
    // Track message in array
    this.msgTrackingArr.push(msg)
    // Store in db
    await this.Bot.Messages.update({ _id: msg._id }, msg, { upsert: true })
  }

  private trackedMsgCleanup() {
    // Block duplicate cleanups if a previous is still running
    if (this.msgCleanupInProgress) return
    // Continue with cleanup
    const now = Date.now()

    // Check for any messages past the memory threshold
    var toCleanupArray = this.msgTrackingArr.filter(msg => {
      // Calculate message age
      const age = Math.round(now - msg.messageCreatedAt)
      if (age > msg.storageKeepInMemFor) {
        this.Bot
          .DEBUG_MSG_SCHEDULED(`mem cleanup => id:${msg.messageId} createdAt:${msg.messageCreatedAt} age:${age}`)
        return true
      }
    })

    // Process cleanup
    if (toCleanupArray.length > 0) {
      for (let index = 0; index < toCleanupArray.length; index++) {
        const msgToClean = toCleanupArray[index];
        this.removeMemTrackedMsg(msgToClean.messageId, true)
      }
      // end cleanup
      this.msgCleanupInProgress = false
    }
  }

  private async trackedMsgDeletionCleanup() {
    // Block duplicate cleanups if a previous is still running
    if (this.msgDeletionCleanupInProgress) return
    this.msgDeletionCleanupInProgress = true
    // Continue with cleanup
    const now = Date.now()
    // Array to track messages from the same server
    var messagesByChannel: { [channel: string]: Array<string> } = {}
    var messagesFound = 0

    // Check for any messages past 10 seconds old
    for (const key in this.msgTrackingArr) {
      const msg = this.msgTrackingArr[key];
      // Skip if TrackedMessage.flagAutoDelete === false
      if (!msg.flagAutoDelete) return;

      // Calculate message age
      const age = Math.round(now - msg.messageCreatedAt)
      const deleteAfter = msg.storageKeepInChatFor > 0
        ? msg.storageKeepInChatFor
        : this.msgDeletionCleanupAge

      // If age of message meets the criteria (First check the TrackedMessage retain else fallback to .env)
      if (age > deleteAfter) {
        this.DEBUG_MSG_TRACKER(`cleanup => id:${msg.messageId} createdAt:${msg.messageCreatedAt} age:${age}`)
        // Create an object if channel is not yet tracked
        if (!messagesByChannel[msg.channelId]) messagesByChannel[msg.channelId] = []
        // Add it to the cleanup array
        messagesByChannel[msg.channelId].push(msg.messageId)
        messagesFound += 1
      }
    }

    // Only pring to debug if the previous was not 0
    if (this.msgDeletionPreviousCount > 0) {
      // Process cleanup
      this.Bot.DEBUG_MSG_SCHEDULED(`Cleanup found [${messagesFound}] to delete from chat`)
    }

    for (const key in messagesByChannel) {
      const channelMessageIDs = messagesByChannel[key];
      const channel = (<TextChannel>this.Bot.client.channels.find(ch => ch.id === key))
      await channel.bulkDelete(channelMessageIDs)
      // Remove from memory tracking too
      for (let index = 0; index < channelMessageIDs.length; index++) {
        const msgID = channelMessageIDs[index];
        this.removeMemTrackedMsg(msgID, true)
      }
    }

    // Update deletion count
    this.msgDeletionPreviousCount = messagesFound
    this.msgDeletionCleanupInProgress = false
  }

  private async removeMemTrackedMsg(messageId: string, oldCleanup?: boolean) {
    // Find msg id's index
    const foundMsgIndex = this.msgTrackingArr.findIndex(msg => msg.messageId === messageId)
    // Remove msg from tracking
    this.msgTrackingArr.splice(foundMsgIndex, 1)
    await this.Bot.Messages.remove({ messageId: messageId })
    if (oldCleanup) this.Bot.DEBUG_MSG_SCHEDULED(`deleted old message in mem id:${messageId}`)
  }
}
