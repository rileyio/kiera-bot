import { EmbedBuilder, User } from 'discord.js'

import { TrackedDecision } from '#objects/decision'

export function decisionLogLast5(decision: TrackedDecision, user: User) {
  return new EmbedBuilder()
    .setDescription(`Decision Title: \`${decision.name}\`\nCreated: \`${new Date(parseInt(String(decision._id).substring(0, 8), 16) * 1000).toUTCString()}\`\n\n **Last 5 Rolls:**`)
    .setFields(
      [].concat(
        decision.log.slice(0, 5).map((l) => {
          return {
            name: new Date(parseInt(String(l._id).substring(0, 8), 16) * 1000).toUTCString(),
            value: `> Run by: <@${l.callerID}>\n> Outcome: ${l.outcomeContent.replace(/\n/g, '\n> ')}`
          }
        })
      )
    )
    .setFooter({
      iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`,
      text: `Decision Author: ${user.username}#${user.discriminator}`
    })
    .setTitle(`Log For \`${decision._id}\``)
}
