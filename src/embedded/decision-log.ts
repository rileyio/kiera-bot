import { TrackedDecision } from '@/objects/decision'
import { User } from 'discord.js'

export function decisionLogLast5(decision: TrackedDecision, user: User) {
  var _embed = {
    embed: {
      title: `Log For \`${decision._id}\``,
      description: `Decision Title: \`${decision.name}\`\nCreated: \`${new Date(parseInt(String(decision._id).substring(0, 8), 16) * 1000).toUTCString()}\`\n\n **Last 5 Rolls:**`,
      color: 14553782,
      fields: [].concat(
        decision.log.slice(0, 5).map(l => {
          return {
            name: new Date(parseInt(String(l._id).substring(0, 8), 16) * 1000).toUTCString(),
            value: `> Run by: <@${l.callerID}>\n> Outcome: ${decision.options.find(o => String(o._id) === l.outcomeID).text.replace(/\n/g, '\n> ')}`
          }
        })
      ),
      footer: {
        icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`,
        text: `Decision Author: ${user.username}#${user.discriminator}`
      }
    }
  }

  return _embed
}
