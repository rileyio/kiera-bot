import { TrackedDecision, TrackedDecisionOption } from '../objects/decision';
import * as Utils from '../utils/'

export function decisionFromSaved(decision: TrackedDecision, option: TrackedDecisionOption) {
  var _embed = {
    embed: {
      title: `${decision.name}`,
      color: 14553782
    }
  }

  if (Utils.URL.isImage(option.text)) {
    _embed.embed['image'] = { url: option.text }
  }
  else {
    // If its just plain text return surrounded by ``
    _embed.embed['description'] = `\`${option.text}\``
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
  }
  else {
    // If its just plain text return surrounded by ``
    _embed.embed['description'] = `\`${result}\``
  }

  return _embed
}