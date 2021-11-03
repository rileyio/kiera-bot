import { ChastiKeyManagedChanges } from '@/objects/chastikey'
import { GuildMember, MessageEmbed } from 'discord.js'

export function managedUpdate(member: GuildMember, updates: Array<ChastiKeyManagedChanges>): Partial<MessageEmbed> {
  const lockeeUpdates = updates.filter((u, i) => u.category === 'lockee' && u.action !== 'header' && u.action !== 'performance')
  const keyholderUpdates = updates.find((u, i) => u.category === 'keyholder' && u.action !== 'header' && u.action !== 'performance')
  const nicknameUpdates = updates.find((u, i) => u.category === 'nickname' && u.action !== 'header' && u.action !== 'performance')
  const eventUpdates = updates.filter((u, i) => u.category === 'locktober' && u.action !== 'header' && u.action !== 'performance')
  const performance = updates.find((u, i) => u.action === 'performance-overall')

  return {
    title: `Summary of changes to \`@${member.nickname || member.user.username + '#' + member.user.discriminator}\``,
    description: 'The following changes are managed by Kiera. Modifying any of these manually may result in Kiera overriding later when the `update` command is called again.',
    color: 9125611,
    timestamp: Date.now(),
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Processing time: ${performance.result}ms`
    },
    thumbnail: {
      url: `https://cdn.discordapp.com/avatars/${member.id}/${member.user.avatar}`
    },
    fields: [
      lockeeUpdates.length
        ? {
            name: 'Lockee Status Roles',
            value: lockeeUpdates
              .map((status) => (status ? `${status.action === 'added' || status.action === 'changed' ? '✅ ' : '❌ '}${status.result}` : '✅ No changes'))
              .join('\n'),
            inline: false
          }
        : {
            name: 'Lockee Status Roles',
            value: '✅ No changes',
            inline: false
          },
      {
        name: 'Keyholder Status Roles',
        value: keyholderUpdates ? `${keyholderUpdates.action === 'added' || keyholderUpdates.action === 'changed' ? '✅ ' : '❌ '}${keyholderUpdates.result}` : '✅ No changes',
        inline: false
      },
      {
        name: 'Nickname Management',
        value: nicknameUpdates ? `${nicknameUpdates.successful === false ? '✅ Updated to ' : '❌ '}\`${nicknameUpdates.result}\`` : '✅ No changes',
        inline: false
      },
      // Events
      eventUpdates.length
        ? {
            name: 'Events',
            value: eventUpdates.map((event) => `${event.action === 'added' || event.action === 'changed' ? '✅ ' : '❌ '}${event.result}`).join(', '),
            inline: false
          }
        : {
            name: 'Events',
            value: '✅ No changes',
            inline: false
          }
    ]
  }
}
