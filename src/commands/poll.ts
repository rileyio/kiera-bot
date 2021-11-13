import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'

import { Message } from 'discord.js'
import { ObjectId } from 'bson'
import { TrackedPoll } from '@/objects/poll'
import { poll } from '@/embedded/poll'

export const Routes = ExportRoutes(
  {
    category: 'Fun',
    controller: voteNew,
    description: 'Help.Poll.New.Description',
    example: '{{prefix}}poll new "Is Kiera the cat cute?"',
    name: 'poll-new',
    type: 'message',
    validate: '/poll:string/new:string/question=string'
  },
  {
    category: 'Fun',
    controller: voteEdit,
    description: 'Help.Poll.Edit.Description',
    example: '{{prefix}}poll edit 5cfcf44614e8a64034ca89f3 public false',
    name: 'poll-edit',
    type: 'message',
    validate: '/poll:string/edit:string/id=string/property=string/update=string'
  },
  {
    category: 'Fun',
    controller: startPoll,
    description: 'Help.Poll.Start.Description',
    example: '{{prefix}}poll start 5cfcf44614e8a64034ca89f3',
    name: 'poll-start',
    type: 'message',
    validate: '/poll:string/start:string/id=string'
  },
  {
    category: 'Fun',
    controller: stopPoll,
    description: 'Help.Poll.Stop.Description',
    example: '{{prefix}}poll stop 5cfcf44614e8a64034ca89f3',
    name: 'poll-stop',
    type: 'message',
    validate: '/poll:string/stop:string/id=string'
  },
  {
    category: 'Fun',
    controller: pickRandomVote,
    description: 'Help.Poll.PickRandomVote.Description',
    example: '{{prefix}}poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:',
    name: 'poll-pick-random-vote',
    type: 'message',
    validate: '/poll:string/pick:string/random:string/id=string/emoji=string'
  },
  {
    category: 'Fun',
    controller: addOption,
    description: 'Help.Poll.AddOption.Description',
    example: '{{prefix}}poll add option 5cfcf44614e8a64034ca89f3 :thumbsup: "Optional description here"',
    name: 'poll-add-option',
    type: 'message',
    validate: '/poll:string/add:string/option:string/id=string/emoji=string/description?=string'
  },
  {
    category: 'Fun',
    controller: removeOption,
    description: 'Help.Poll.RemoveOption.Description',
    example: '{{prefix}}poll add option 5cfcf44614e8a64034ca89f3 :thumbsup:',
    name: 'poll-remove-option',
    type: 'message',
    validate: '/poll:string/remove:string/option:string/id=string/optionID=string'
  },
  {
    category: 'Fun',
    controller: handleReact,
    name: 'poll-react-vote',
    type: 'reaction'
  }
)

/**
 * Create a new poll
 * @export
 * @param {RouterRouted} routed
 */
export async function voteNew(routed: RouterRouted) {
  // Commit record to db
  const insertedRecordID = await routed.bot.DB.add(
    'polls',
    new TrackedPoll({
      authorID: routed.author.id,
      question: routed.v.o.question
    })
  )

  await routed.message.reply(
    routed.$render('Poll.New', {
      id: insertedRecordID,
      question: routed.v.o.question
    })
  )

  return true
}

/**
 * Edit an existing poll
 * @export
 * @param {RouterRouted} routed
 */
export async function voteEdit(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    _id: new ObjectId(routed.v.o.id),
    authorID: routed.author.id
  })

  if (storedPoll) {
    // Construct poll for prop & helpers from class
    storedPoll = new TrackedPoll(storedPoll)
    let _previousValue: any

    switch (routed.v.o.property) {
      case 'open':
        _previousValue = storedPoll.isOpen
        storedPoll.isOpen = routed.v.o.update === 'true' ? true : false
        break
      case 'public':
        _previousValue = storedPoll.isPublic
        storedPoll.isPublic = routed.v.o.update === 'true' ? true : false
        break
      case 'question':
        _previousValue = storedPoll.question
        storedPoll.question = routed.v.o.update
        break
      case 'title':
        _previousValue = storedPoll.title
        storedPoll.title = routed.v.o.update
        break
      case 'footer':
        _previousValue = storedPoll.footer
        storedPoll.footer = routed.v.o.update
        break

      // Default catch and return message - Stop here
      default:
        await routed.message.reply(routed.$render('Poll.Error.PropertyNotFound'))
        return false // Stop here
    }

    // Perform DB Update
    const updateCount = await routed.bot.DB.update('polls', { _id: new ObjectId(routed.v.o.id) }, storedPoll)

    // Update successful
    if (updateCount > 0)
      await routed.message.reply(
        routed.$sb(routed.$render('Poll.Error.PropertyUpdated'), {
          from: _previousValue,
          id: routed.v.o.id,
          property: routed.v.o.property,
          to: routed.v.o.update
        })
      )

    return true
  } else {
    // Can't find poll in DB
    await routed.message.reply(routed.$render('Poll.Error.NotFoundInDB'))
    return false
  }
}

/**
 * Reaction event handler
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function handleReact(routed: RouterRouted) {
  // Reaction added
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    messageID: new ObjectId(routed.trackedMessage._id)
  })

  if (storedPoll) {
    storedPoll = new TrackedPoll(storedPoll)
    // Stop if poll is expired/closed
    if (!storedPoll.isOpen) {
      await routed.author.send(routed.$render('Poll.Info.Expired'))
      return true // Stop here
    }

    // Add / Remove react
    if (routed.state === 'added') {
      storedPoll.addVote(routed.author.id, routed.message.guild.id, routed.reaction.reaction)

      // Update in DB
      const updateCount = await routed.bot.DB.update('polls', { messageID: new ObjectId(routed.trackedMessage._id) }, storedPoll)

      if (updateCount > 0) await routed.author.send(routed.$render('Poll.Interaction.VoteCast'))
      return true // Stop here
    } else {
      const deleteCount = await routed.bot.DB.update(
        'polls',
        {
          messageID: new ObjectId(routed.trackedMessage._id),
          'votes.authorID': routed.author.id,
          'votes.vote': routed.reaction.reaction
        },
        { $pull: { votes: { authorID: routed.author.id, vote: routed.reaction.reaction } } },
        { atomic: true }
      )

      if (deleteCount > 0) await routed.author.send(routed.$render('Poll.Interaction.VoteRemoved'))
      return true // Stop here
    }
  }

  return false
}

/**
 * Prints the block which users may vote upon
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function startPoll(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    // Lookup by given ObjectId in args
    _id: new ObjectId(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to startPoll on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply(routed.$render('Poll.Warn.DifferentAuthorID'))
      return false // Stop Here
    }
    1

    // Print message to chat for members to vote upon
    const messageSent = (await routed.message.channel.send({ embeds: [poll(storedPoll)] })) as Message

    // Track Message
    const messageID = await routed.bot.MsgTracker.trackNewMsg(messageSent, { reactionRoute: 'poll-react-vote' })

    // Update Message ID & snowflake to watch for
    storedPoll.messageID = messageID
    storedPoll.messageSnowflake = messageSent.id

    // Update in db
    await routed.bot.DB.update('polls', { _id: new ObjectId(routed.v.o.id) }, storedPoll)
    // await routed.message.reply('```json\n' + JSON.stringify(storedPoll, null, 2) + '```')
  } else {
    await routed.message.reply(routed.$render('Poll.Error.NotFoundInDB'))
  }

  return true
}

/**
 * Ends a currently running poll from tracking new emojis (votes)
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function stopPoll(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    // Lookup by given ObjectId in args
    _id: new ObjectId(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to stopPoll on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply(routed.$render('Poll.Warn.DifferentAuthorID'))
      return false // Stop Here
    }

    // Print message to chat informing users the poll has concluded
    await routed.message.reply(routed.$render('Poll.Info.Ended'))

    // Update open status
    storedPoll.isOpen = false

    // Update in db
    await routed.bot.DB.update('polls', { _id: new ObjectId(routed.v.o.id) }, storedPoll)
  } else {
    await routed.message.reply(routed.$render('Poll.Error.NotFoundInDB'))
  }

  return true
}

/**
 * Randomly selects and prints a vote by a user of the given emoji type
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function pickRandomVote(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    // Lookup by given ObjectId in args
    _id: new ObjectId(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to call on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply(routed.$render('Poll.Warn.DifferentAuthorID'))
      return false // Stop Here
    }

    const randomReaction = storedPoll.pickRandomVote(routed.v.o.emoji)

    await routed.message.channel.send(
      routed.$render('Poll.Info.RandomVoteSelected', {
        by: Utils.User.buildUserWrappedSnowflake(randomReaction.authorID),
        emoji: randomReaction.vote
      })
    )
  } else {
    await routed.message.reply(routed.$render('Poll.Error.NotFoundInDB'))
  }

  return true
}

/**
 * Adds an option to the current poll for calculating outcomes on
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function addOption(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    // Lookup by given ObjectId in args
    _id: new ObjectId(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to call on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply(routed.$render('Poll.Warn.DifferentAuthorID'))
      return false // Stop Here
    }

    const optionID = storedPoll.addVoteOption(routed.v.o.emoji, routed.v.o.description)

    // Update in db
    await routed.bot.DB.update('polls', { _id: new ObjectId(routed.v.o.id) }, storedPoll)

    await routed.message.reply(
      routed.$render('Poll.Edit.OptionAdded', {
        description: routed.v.o.description || '',
        emoji: routed.v.o.emoji,
        id: routed.v.o.id,
        optionID: optionID
      })
    )
  }

  return true
}

/**
 * Removes an option to the current poll for calculating outcomes on
 *
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function removeOption(routed: RouterRouted) {
  // Find poll in db
  let storedPoll = await routed.bot.DB.get('polls', {
    // Lookup by given ObjectId in args
    _id: new ObjectId(routed.v.o.id)
  })

  if (storedPoll) {
    // Construct Object
    storedPoll = new TrackedPoll(storedPoll)

    // Only allow the author to call on their own
    if (storedPoll.authorID !== routed.message.author.id) {
      await routed.message.reply(routed.$render('Poll.Warn.DifferentAuthorID'))
      return false // Stop Here
    }

    const deleteCount = await routed.bot.DB.update(
      'polls',
      { _id: new ObjectId(routed.v.o.id), 'emojiOptions._id': new ObjectId(routed.v.o.optionID) },
      { $pull: { emojiOptions: { _id: new ObjectId(routed.v.o.optionID) } } },
      { atomic: true }
    )

    // If there was no vote option to remove: inform the user
    if (!deleteCount) {
      await routed.message.reply(
        routed.$render('Poll.Error.OptionNotFound', {
          optionID: routed.v.o.optionID
        })
      )
      return false // Stop here
    }

    await routed.message.reply(
      routed.$render('Poll.Edit.OptionRemoved', {
        optionID: routed.v.o.optionID
      })
    )
  }

  return true
}
