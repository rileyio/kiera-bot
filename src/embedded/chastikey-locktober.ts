export function locktoberStats(totalParticipants: number, isUserApart: boolean) {
  var description = `What is Locktober? Be locked for the entire month of October :yum:\n\n`
  description += `# of participants:\`${totalParticipants}\`\n`
  description += (isUserApart) ? `Your lock is a valid Locktober lock!` : ``

  return {
    embed: {
      title: `Locktober Stats`,
      description: description,
      color: 14553782
    }
  }
}