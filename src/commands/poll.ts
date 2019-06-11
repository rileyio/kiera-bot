import * as Utils from '../utils'
import { RouterRouted } from '../router/router';
import { ExportRoutes } from '../router/routes-exporter';
import { TrackedPoll } from '../objects/poll';
import { ObjectID } from 'bson';
import { Message, Channel } from 'discord.js';
import { poll } from '../embedded/poll';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'argument',
    controller: voteNew,
    example: '{{prefix}}poll new "Is Kiera the cat cute?"',
    name: 'poll-new',
    validate: '/poll:string/new:string/question=string'
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'argument',
    controller: voteEdit,
    example: '{{prefix}}poll edit 5cfcf44614e8a64034ca89f3 public false',
    name: 'poll-edit',
    validate: '/poll:string/edit:string/id=string/property=string/update=string'
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'argument',
    controller: startPoll,
    example: '{{prefix}}poll start 5cfcf44614e8a64034ca89f3',
    name: 'poll-start',
    validate: '/poll:string/start:string/id=string'
  },
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'argument',
    controller: pickRandomVote,
    example: '{{prefix}}poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:',
    name: 'poll-pick-random-vote',
    validate: '/poll:string/pick:string/random:string/id=string/emoji=string'
  },
  {
    type: 'reaction',
    category: 'Fun',
    commandTarget: 'controller-decision',
    controller: handleReact,
    name: 'poll-react-vote'
  },
)

/**
 * Create a new poll
 * @export
 * @param {RouterRouted} routed
 */
export async function voteNew(routed: RouterRouted) {
  // Commit record to db
  const insertedRecordID = await routed.bot.DB.add('polls', new TrackedPoll({
    authorID: routed.user.id,
    question: routed.v.o.question
  }))

  await routed.message.reply(Utils.sb(Utils.en.poll.newPollCreated, {
    id: insertedRecordID,
    question: routed.v.o.question
  }))

  return true
}

/**
 * Edit an existing poll
 * @export
 * @param {RouterRouted} routed
 */
export async function voteEdit(routed: RouterRouted) {
  // Find poll in db
  var storedPoll = await routed.bot.DB.get<TrackedPoll>('polls', {
    _id: new ObjectID(routed.v.o.id),
    authorID: routed.user.id
  })

  if (storedPoll) {
    // Construct poll for prop & helpers from class
    storedPoll = new TrackedPoll(storedPoll)
    var _previousValue: any;

    switch (routed.v.o.property) {
      case 'open':
        _previousValue = storedPoll.isOpen
        storedPoll.isOpen = routed.v.o.update === 'true' ? true : false
        break;
      case 'public':
        _previousValue = storedPoll.isPublic
        storedPoll.isPublic = routed.v.o.update === 'true' ? true : false
        break;
      case 'question':
        _previousValue = storedPoll.question
        storedPoll.question = routed.v.o.update
        break;
      case 'title':
        _previousValue = storedPoll.title
        storedPoll.title = routed.v.o.update
        break;
      case 'footer':
        _previousValue = storedPoll.footer
        storedPoll.footer = routed.v.o.update
        break;

      // Default catch and return message - Stop here
      default:
        await routed.message.reply(Utils.sb(Utils.en.poll.pollPropertyNotFound))
        return false // Stop here
    }

    // Perform DB Update
    const updateCount = await routed.bot.DB.update<TrackedPoll>('polls', { _id: new ObjectID(routed.v.o.id) }, storedPoll)

    // Update successful
    if (updateCount > 0) await routed.message.reply(Utils.sb(Utils.en.poll.pollPropertyUpdated, {
      id: routed.v.o.id,
      property: routed.v.o.property,
      from: _previousValue,
      to: routed.v.o.update
    }))

    return true
  }
  else {
    // Can't find poll in DB
    await routed.message.reply(Utils.sb(Utils.en.poll.pollNotFoundInDB))
    return false
  }
}

export async function handleReact(routed: RouterRouted) {
  console.log(routed.state)

  // Reaction added
  // Find poll in db
  var storedPoll = await routed.bot.DB.get<TrackedPoll>('polls', {
    messageID: new ObjectID(routed.trackedMessage._id)
  })

  console.log('handleReact')

  if (storedPoll) {
    storedPoll = new TrackedPoll(storedPoll)
    // Stop if poll is expired/closed
    if (!storedPoll.isOpen) {
      await routed.message.reply(Utils.sb(Utils.en.poll.pollExpired))
      return true // Stop here
    }

    // Add / Remove react
    if (routed.state === 'added') storedPoll.addVote(routed.user.id, routed.message.guild.id, routed.reaction.reaction)
    else storedPoll.removeVote(routed.user.id, routed.message.guild.id, routed.reaction.reaction)

    // Update in DB
    const updateCount = await routed.bot.DB.update<TrackedPoll>('polls', { messageID: new ObjectID(routed.trackedMessage._id) }, storedPoll)

    if (updateCount > 0) {
      if (routed.state === 'added') await routed.user.sendMessage(Utils.sb(Utils.en.poll.pollVoteCast))
      else await routed.user.sendMessage(Utils.sb(Utils.en.poll.pollVoteRemoved))
    }
    return true // Stop here
  }
}

export async function startPoll(routed: RouterRouted) {
  // Find poll in db
  var storedPoll = await routed.bot.DB.get<TrackedPoll>('polls', {
    // Lookup by given ObjectID in args
    _id: new ObjectID(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to startPoll on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply((Utils.sb(Utils.en.poll.pollDifferentAuthorID)))
      return false // Stop Here
    }

    // Print message to chat for members to vote upon
    const messageSent = await routed.message.channel.send(poll(storedPoll)) as Message

    // Track Message
    const messageID = await routed.bot.MsgTracker.trackNewMsg(messageSent, { reactionRoute: 'poll-react-vote' })

    // Update Message ID & snowflake to watch for
    storedPoll.messageID = messageID
    storedPoll.messageSnowflake = messageSent.id

    // Update in db
    await routed.bot.DB.update<TrackedPoll>('polls', { _id: new ObjectID(routed.v.o.id) }, storedPoll)
    // await routed.message.reply('```json\n' + JSON.stringify(storedPoll, null, 2) + '```')
  }
  else {
    await routed.message.reply((Utils.sb(Utils.en.poll.pollNotFoundInDB)))
  }

  return true
}

export async function pickRandomVote(routed: RouterRouted) {
  // Find poll in db
  var storedPoll = await routed.bot.DB.get<TrackedPoll>('polls', {
    // Lookup by given ObjectID in args
    _id: new ObjectID(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to call on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply((Utils.sb(Utils.en.poll.pollDifferentAuthorID)))
      return false // Stop Here
    }

    const randomReaction = storedPoll.pickRandomVote(routed.v.o.emoji)

    console.log(routed.v.o.emoji)
    console.log(randomReaction)

    await routed.message.channel.send((Utils.sb(Utils.en.poll.pollRandomVoteSelected, {
      by: Utils.User.buildUserWrappedSnowflake(randomReaction.authorID),
      emoji: randomReaction.vote
    })))
  }
  else {
    await routed.message.reply((Utils.sb(Utils.en.poll.pollNotFoundInDB)))
  }
}
