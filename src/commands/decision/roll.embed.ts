import * as Utils from '@/utils'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { MessageEmbed } from 'discord.js'

export function decisionFromSaved(
  decision: TrackedDecision,
  option: TrackedDecisionOption,
  author: { name: string; avatar: string; id: string; server: { prefix: string } }
): Partial<MessageEmbed> {
  const _embed: Partial<MessageEmbed> = {
    color: 14553782,
    description: `${decision.description}`,
    footer: {
      iconURL: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}`,
      text: `Created by: ${author.name}`
    },
    title: `${decision.name}`
  }

  if (option.type === 'image' || Utils.URL.isImage(option.text)) {
    _embed.image = { url: option.text }
  }
  if (option.type === 'url') {
    _embed.description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    _embed.description = Utils.sb(_embed.description)
  }
  if (option.type === 'markdown') {
    _embed.description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    _embed.description = Utils.sb(_embed.description)
  }
  if (option.type === undefined || option.type === 'string') {
    // If its just plain text return surrounded by ``
    _embed.description += `\n\n**Outcome:** \n\n\`${option.text}\``
    // Run the String Builder
    _embed.description = Utils.sb(_embed.description)
  }

  return _embed
}

export function decisionRealtime(question: string, result: string): Partial<MessageEmbed> {
  const _embed: Partial<MessageEmbed> = {
    color: 14553782,
    title: `${question}`
  }

  if (Utils.URL.isImage(result)) {
    _embed.image = { url: result }
  } else {
    // If its just plain text return surrounded by ``
    _embed.description = `\`${result}\``
  }

  return _embed
}
