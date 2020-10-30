import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import * as Utils from '@/utils'

export function decisionFromSaved(decision: TrackedDecision, option: TrackedDecisionOption, author: { name: string; avatar: string; id: string; server: { prefix: string } }) {
  var _embed = {
    embed: {
      title: `${decision.name}`,
      description: `${decision.description}`,
      color: 14553782,
      footer: {
        icon_url: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}`,
        text: `Created by: ${author.name}`
      }
    }
  }

  if (option.type === 'image' || Utils.URL.isImage(option.text)) {
    _embed.embed['image'] = { url: option.text }
  }
  if (option.type === 'url') {
    _embed.embed.description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    _embed.embed.description = Utils.sb(_embed.embed.description)
  }
  if (option.type === 'markdown') {
    _embed.embed.description += `\n\n**Outcome:** \n\n${option.text}`
    // Run the String Builder
    _embed.embed.description = Utils.sb(_embed.embed.description)
  }
  if (option.type === undefined || option.type === 'string') {
    // If its just plain text return surrounded by ``
    _embed.embed.description += `\n\n**Outcome:** \n\n\`${option.text}\``
    // Run the String Builder
    _embed.embed.description = Utils.sb(_embed.embed.description)
  }

  return _embed
}

export function decisionRealtime(question: string, result: string) {
  var _embed = {
    embed: {
      title: `${question}`,
      color: 14553782
    }
  }

  if (Utils.URL.isImage(result)) {
    _embed.embed['image'] = { url: result }
  } else {
    // If its just plain text return surrounded by ``
    _embed.embed['description'] = `\`${result}\``
  }

  return _embed
}
