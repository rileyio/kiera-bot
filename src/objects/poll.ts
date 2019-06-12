import { ObjectID } from 'bson';

export class TrackedPoll {
  public _id: ObjectID
  public authorID: string
  public emojiOptions: Array<TrackedVoteOption> = []
  public footer: string
  public isOpen: boolean = true
  /**
   * Setting this to true allows the poll to be viewed online via https://kierabot.xyz/
   * @type {boolean}
   * @memberof TrackedPoll
   */
  public isPublic: boolean = true
  public messageID: ObjectID
  public messageSnowflake: string
  public question: string = ''
  public serverID: string
  public title: string = 'Vote'
  public type: 'Emoji' | 'Text' = 'Emoji'
  public votes: Array<TrackedVote> = []

  constructor(init: Partial<TrackedPoll>) {
    Object.assign(this, {
      authorID: init.authorID,
      footer: init.footer || this.footer,
      isOpen: init.isOpen || this.isOpen,
      isPublic: init.isPublic || this.isPublic,
      messageID: init.messageID,
      messageSnowflake: init.messageSnowflake,
      question: init.question || this.question,
      serverID: init.serverID || this.serverID,
      title: init.title || this.title,
      type: init.type || this.type
    });

    // Handle constructors for votes and vote options
    if (init.emojiOptions) this.emojiOptions = init.emojiOptions.map(e => new TrackedVoteOption(e))
    if (init.votes !== undefined) this.votes = init.votes.map(v => new TrackedVote(v))
  }

  public addVote(authorID: string, serverID: string, vote: string) {
    if (this.isOpen) {
      this.votes.push(new TrackedVote({ authorID: authorID, serverID: serverID, vote: vote }))
    }
  }

  public removeVote(authorID: string, serverID: string, vote: string) {
    if (this.isOpen) {
      const voteIndex = this.votes.findIndex(v => v.authorID === authorID && v.vote === vote)
      this.votes.splice(voteIndex, 1)
    }
  }

  public pickRandomVote(vote: string) {
    const votesFiltered = this.votes.filter(emoji => emoji.vote === vote)
    return votesFiltered[Math.floor(Math.random() * Number(votesFiltered.length))]
  }

  public addVoteOption(option: string, description: string) {
    const newOption = new TrackedVoteOption({
      emoji: option,
      description: description
    })

    this.emojiOptions.push(newOption)

    return newOption._id
  }

  public removeVoteOption(id: string) {
    const voteOptionIndex = this.emojiOptions.findIndex(v => v._id.toHexString() === id)
    this.votes.splice(voteOptionIndex, 1)

    return voteOptionIndex > -1 ? true : false
  }
}

export class TrackedVoteOption {
  public _id: ObjectID
  public emoji: string
  public description: string

  constructor(init: Partial<TrackedVoteOption>) {
    Object.assign(this, {
      _id: init._id || new ObjectID(),
      emoji: init.emoji,
      description: init.description || this.description
    });
  }
}

export class TrackedVote {
  public _id: ObjectID
  public authorID: string
  public serverID: string
  public vote: string

  constructor(init: Partial<TrackedVote>) {
    Object.assign(this, {
      _id: init._id || new ObjectID(),
      authorID: init.authorID,
      serverID: init.serverID,
      vote: init.vote
    });
  }
}