export function rollDice(sides: number, count: number, outcome: Array<number>) {
  return {
    embed: {
      title: `:game_die: Rolling ${(count) ? `\`${count}\` dice` : 'a pair of dice'} with **\`${sides}\`** sides`,
      description: `Results from ${count} dice \n\`\`\`js\n[ ${outcome.join(', ')} ]\`\`\``,
      color: 14553782
    }
  }
}

export function rollDie(sides: number, outcome: Array<number>) {
  return {
    embed: {
      title: `:game_die: Rolling a die with **\`${sides}\`** sides`,
      description: `Result: **${outcome[0]}**`,
      color: 14553782
    }
  }
}
