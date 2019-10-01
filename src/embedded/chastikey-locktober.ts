export function locktoberStats(totalParticipants: number, isUserApart: boolean, isUserVerified: boolean) {
  var description = `What is Locktober? Be locked for the entire month of October :yum:\n\n`
  if (!isUserVerified) description += `You'll also need to verify using the following command to receive the role: \`!ck verify\`\n\n`
  description += `# of participants (who have verified): **\`${totalParticipants}\`**\n`
  if (isUserApart) description += `Your lock is a valid Locktober lock!`

  return {
    embed: {
      title: `Locktober Stats`,
      description: description,
      color: 14553782
    }
  }
}