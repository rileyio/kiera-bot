export function eightBallResult(question: string, result: string) {
  return {
    embed: {
      title: `${question}`,
      description: `\`${result}\``,
      color: 14553782
    }
  }
}