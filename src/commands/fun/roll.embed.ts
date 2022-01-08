export function rollDice(sides: number, count: number, outcome: Array<number>) {
  return {
    color: 14553782,
    description: `Results from ${count} dice \n\`\`\`js\n[ ${outcome.join(', ')} ]\`\`\``,
    title: `:game_die: Rolling ${count ? `\`${count}\` dice` : 'a pair of dice'} with **\`${sides}\`** sides`
  }
}

export function rollDie(sides: number, outcome: Array<number>) {
  return {
    color: 14553782,
    description: `Result: **${outcome[0]}**`,
    title: `:game_die: Rolling a die with **\`${sides}\`** sides`
  }
}
