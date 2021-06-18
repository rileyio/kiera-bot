import { ChastiKeyManagedChanges } from '@/objects/chastikey'
import { GuildMember } from 'discord.js'

export function managedUpdate(member: GuildMember, updates: Array<ChastiKeyManagedChanges>) {
  const lockeeUpdates = updates.filter((u, i) => u.category === 'lockee' && u.action !== 'header' && u.action !== 'performance')
  const keyholderUpdates = updates.filter((u, i) => u.category === 'keyholder' && u.action !== 'header' && u.action !== 'performance')
  const nicknameUpdates = updates.filter((u, i) => u.category === 'nickname' && u.action !== 'header' && u.action !== 'performance')
  const eventUpdates = updates.filter((u, i) => u.category === 'locktober' && u.action !== 'header' && u.action !== 'performance')
  const performance = updates.find((u, i) => u.action === 'performance-overall')

  return {
    embed: {
      title: `Summary of changes to \`@${member.nickname || member.user.username + '#' + member.user.discriminator}\``,
      description: 'The following changes are managed by Kiera. Modifying any of these manually may result in Kiera overriding later when the `update` command is called again.',
      color: 9125611,
      timestamp: Date.now(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Processing time: ${performance.result}ms`
      },
      thumbnail: {
        url: `https://cdn.discordapp.com/avatars/${member.id}/${member.user.avatar}`
      },
      fields: [
        {
          name: 'Lockee Status Roles',
          value: lockeeUpdates.length ? lockeeUpdates.map((u) => `${u.action === 'added' || u.action === 'changed' ? '✅ ' : '❎ '}${u.result}`) : '✅ No changes',
          inline: true
        },
        {
          name: 'Keyholder Status Roles',
          value: keyholderUpdates.length ? keyholderUpdates.map((u) => `${u.action === 'added' || u.action === 'changed' ? '✅ ' : '❎ '}${u.result}`) : '✅ No changes',
          inline: true
        },
        {
          name: 'Nickname Management',
          value: nicknameUpdates.length ? `${nicknameUpdates[0].successful === false ? '✅ Updated to ' : '❌ '}\`${nicknameUpdates[0].result}\`` : '✅ No changes'
        },
        {
          name: 'Events',
          value: eventUpdates.length ? eventUpdates.map((u) => `${u.action === 'added' || u.action === 'changed' ? '✅ ' : '❎ '}${u.result}`) : '✅ No changes'
        }
      ]
    }
  }
}
