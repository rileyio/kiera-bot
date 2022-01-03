import { MessageEmbed } from 'discord.js'
import { TrackedDecision } from '@/objects/decision'

export function embed(authorID: string, decisions: Array<TrackedDecision>): Partial<MessageEmbed> {
  const asOwner = decisions.filter((d) => d.authorID === authorID)
  const asManager = decisions.filter((d) => (d.hasOwnProperty('managers') ? d.managers.findIndex((a) => a === authorID) > -1 : false))

  return {
    color: 14553782,
    fields: [
      {
        inline: false,
        name: 'As Owner',
        value: !asOwner.length
          ? 'None to List'
          : asOwner
              .map((d) => {
                return `ID: \`${d._id}\`\nName: ${d.name}\n${d.nickname ? `Nickname: ${d.nickname}\n` : ''}Options: \`${d.options.length}\`\n`
              })
              .join('\n')
      },
      {
        inline: false,
        name: 'As Manager',
        value: !asManager.length
          ? 'None to List'
          : asManager
              .map((d) => {
                return `ID: \`${d._id}\`\nName: ${d.name}\n${d.nickname ? `Nickname: ${d.nickname}\n` : ''}Options: \`${d.options.length}\`\n`
              })
              .join('\n')
      }
    ],
    title: 'Decision Rollers you Own / Manage'
  }
}