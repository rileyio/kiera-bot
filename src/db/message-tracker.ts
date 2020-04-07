import { TrackedMessage } from '@/objects/message'
import { Bot } from '@/index'
import { TextChannel, Message } from 'discord.js'
import { Logging } from '@/utils'

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
  public DEBUG_MSG_TRACKER = new Logging.Debug('msgTracker')

  constructor(bot: Bot) {
    this.Bot = bot
    // Block duplicates - if that somehow were possible......
    if (!this.msgProcesserRunning) {
      this.DEBUG_MSG_TRACKER.log('starting MsgTracker...')
      // Memory cleanup, remove old messages tracked beyond TrackedMessage.storage_keep_for age
      setInterval(() => this.trackedMsgCleanup(), this.msgProcesserMemInterval)
      // Scan msgArray for messages with TrackedMessage.flagAutoDelete === true beyond
      // their defined period
      setInterval(() => this.trackedMsgDeletionCleanup(), this.msgProcesserInterval)
    }
  }

  public async trackNewMsg(msg: Message | Array<Message>, opts?: { reactionRoute?: string }) {
    const isArray = Array.isArray(msg)

    // If msg param comes in as an Array
    if (isArray) {
      for (let index = 0; index < (<Array<Message>>msg).length; index++) {
        const message = Object.assign((<Array<Message>>msg)[index], opts || {})

        return await this.trackMsg(
          new TrackedMessage({
            authorID: message.author.id,
            id: message.id,
            messageCreatedAt: message.createdAt.getTime(),
            channelId: message.channel.id,
            // Flags
            flagTrack: true,
            // React tracking
            reactions: message.reactions.cache.array(),
            reactionRoute: message.reactionRoute
          })
        )
      }
    }

    // If msg is just a regular Discord.Message type
    const message = Object.assign(<Message>msg, opts || {})
    return await this.trackMsg(
      new TrackedMessage({
        authorID: message.author.id,
        id: message.id,
        messageCreatedAt: message.createdAt.getTime(),
        channelId: message.channel.id,
        // Flags
        flagTrack: true,
        // React tracking
        reactions: message.reactions.cache.array(),
        reactionRoute: message.reactionRoute
      })
    )
  }

  public async trackMsg(msg: TrackedMessage) {
    // Track message in array
    this.msgTrackingArr.push(msg)
    // Store in db
    await this.Bot.DB.update('messages', { _id: msg._id }, msg, { upsert: true })
    // Return message object id
    return msg._id
  }

  private trackedMsgCleanup() {
    // Block duplicate cleanups if a previous is still running
    if (this.msgCleanupInProgress) return
    // Continue with cleanup
    const now = Date.now()

    // Check for any messages past the memory threshold
    var toCleanupArray = this.msgTrackingArr.filter((msg) => {
      // Calculate message age
      const age = Math.round(now - msg.messageCreatedAt)
      if (age > msg.storageKeepInMemFor) {
        this.Bot.Log.Scheduled.log(`mem cleanup => id:${msg.id} createdAt:${msg.messageCreatedAt} age:${age}`)
        return true
      }
    })

    // Process cleanup
    if (toCleanupArray.length > 0) {
      for (let index = 0; index < toCleanupArray.length; index++) {
        const msgToClean = toCleanupArray[index]
        this.removeMemTrackedMsg(msgToClean.id, !msgToClean.flagAutoDelete)
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
      const msg = this.msgTrackingArr[key]
      // Skip if TrackedMessage.flagAutoDelete === false
      if (!msg.flagAutoDelete) continue

      // Calculate message age
      const age = Math.round(now - msg.messageCreatedAt)
      const deleteAfter = msg.storageKeepInChatFor > 0 ? msg.storageKeepInChatFor : this.msgDeletionCleanupAge

      // If age of message meets the criteria (First check the TrackedMessage retain else fallback to .env)
      if (age > deleteAfter) {
        this.DEBUG_MSG_TRACKER.log(`cleanup => id:${msg.id} createdAt:${msg.messageCreatedAt} age:${age}`)
        // Create an object if channel is not yet tracked
        if (!messagesByChannel[msg.channelId]) messagesByChannel[msg.channelId] = []
        // Add it to the cleanup array
        messagesByChannel[msg.channelId].push(msg.id)
        messagesFound += 1
      }
    }

    // Only pring to debug if the previous was not 0
    if (this.msgDeletionPreviousCount > 0) {
      // Process cleanup
      this.Bot.Log.Scheduled.log(`Cleanup found [${messagesFound}] to delete from chat`)
    }

    for (const key in messagesByChannel) {
      const channelids = messagesByChannel[key]
      const channel = <TextChannel>this.Bot.client.channels.cache.find((ch) => ch.id === key)
      await channel.bulkDelete(channelids)
      // Remove from memory tracking too
      for (let index = 0; index < channelids.length; index++) {
        const msgID = channelids[index]
        this.removeMemTrackedMsg(msgID, true)
      }
    }

    // Update deletion count
    this.msgDeletionPreviousCount = messagesFound
    this.msgDeletionCleanupInProgress = false
  }

  private async removeMemTrackedMsg(id: string, keepInDB: boolean = true) {
    // Find msg id's index
    const foundMsgIndex = this.msgTrackingArr.findIndex((msg) => msg.id === id)
    // Remove msg from tracking
    this.msgTrackingArr.splice(foundMsgIndex, 1)
    if (!keepInDB) await this.Bot.DB.remove('messages', { id: id })
    this.Bot.Log.Scheduled.log(`deleted old message in mem id:${id}`)
  }
}
