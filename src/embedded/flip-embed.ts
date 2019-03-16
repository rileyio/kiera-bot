export function flipCoin(outcome: number) {
  return {
    embed: {
      title: outcome === 0 ? '`Heads`' : '`Tails`',
      color: 14553782
    }
  }
}
