import * as Utils from '#utils'
import { TrackedDecision, TrackedDecisionOption } from '#objects/decision'
import { EmbedBuilder } from 'discord.js'

export function decisionFromSaved(decision: TrackedDecision, option: TrackedDecisionOption, author: { name: string; avatar: string; id: string }) {
  const embed = new EmbedBuilder()
    .setColor(14553782)
    .setFooter({
      iconURL: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}`,
      text: `Created by: ${author.name}`
    })
    .setTitle(`${decision.name}`)
  let description = `${decision.description}`

  if (option.type === 'image' || Utils.URL.isImage(option.text)) {
    embed.setImage(option.text)
  }
  if (option.type === 'url') {
    description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    description = Utils.sb(description)
  }
  if (option.type === 'markdown') {
    description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    description = Utils.sb(description)
  }
  if (option.type === undefined || option.type === 'string') {
    // If its just plain text return surrounded by ``
    description += `\n\n**Outcome:** \n\n\`${option.text}\``
    // Run the String Builder
    description = Utils.sb(description)
  }

  if (description) embed.setDescription(description)

  return embed
}

export function decisionRealtime(question: string, result: string) {
  const embed = new EmbedBuilder().setColor(14553782).setTitle(question)

  if (Utils.URL.isImage(result)) {
    embed.setImage(result)
  } else {
    // If its just plain text return surrounded by ``
    embed.setDescription(`\`${result}\``)
  }

  return embed
}
