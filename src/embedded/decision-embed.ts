import { TrackedDecision, TrackedDecisionOption } from '../objects/decision';

export function decisionFromSaved(decision: TrackedDecision, option: TrackedDecisionOption) {
  return {
    embed: {
      title: `Decision \'${decision.name}\'`,
      description: `\`${option.text}\``,
      color: 14553782
    }
  }
}

export function decisionRealtime(question: string, result: string) {
  return {
    embed: {
      title: `${question}`,
      description: `\`${result}\``,
      color: 14553782
    }
  }
}