import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import * as Utils from '@/utils'
import { GuildMember } from 'discord.js'

export function decisionFromSaved(decision: TrackedDecision, option: TrackedDecisionOption, additional: { author: GuildMember }) {
  var _embed = {
    embed: {
      title: `${decision.name}`,
      description: `${decision.description}`,
      color: 14553782,
      footer: {
        icon_url: `https://cdn.discordapp.com/avatars/${additional.author.user.id}/${additional.author.user.avatar}`,
        text: `Created by: ${additional.author.nickname || additional.author.user.username}#${additional.author.user.discriminator}`
      }
    }
  }

  if (option.type === 'image' || Utils.URL.isImage(option.text)) {
    _embed.embed['image'] = { url: option.text }
  }
  if (option.type === 'url') {
    _embed.embed.description += `\n\n**Outcome:** \n\n${option.text}`
  }
  if (option.type === 'markdown') {
    _embed.embed.description += `\n\n**Outcome:** \n\n${option.text}`
  }
  if (option.type === undefined || option.type === 'string') {
    // If its just plain text return surrounded by ``
    _embed.embed.description += `\n\n**Outcome:** \n\n\`${option.text}\``
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
