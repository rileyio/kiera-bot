import { TrackedPoll } from '../objects/poll';

export function poll(poll: TrackedPoll) {
  const embed = {
    embed: {
      title: poll.title,
      description: poll.question,
      color: 10494719,
      footer: {
        text: poll.footer
      }
    }
  }

  // Only add a footer if specified
  if (poll.footer) {
    embed.embed['footer'] = { text: poll.footer }
  }

  // Return constructed embed
  return embed
}
