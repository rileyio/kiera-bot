import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Info',
  controller: getBotStats,
  example: '{{prefix}}admin stats',
  name: 'admin-stats',
  permissions: {
    defaultEnabled: false,
    serverAdminOnly: true
  },
  validate: '/admin:string/stats:string'
})

export async function getBotStats(routed: RouterRouted) {
  const stats = routed.bot.BotMonitor.LiveStatistics.BotStatistics
  var sec = Math.floor(stats.uptime / 1000)
  var min = Math.floor(sec / 60)
  sec = sec % 60
  var hrs = Math.floor(min / 60)
  min = min % 60
  var days = Math.floor(hrs / 24)
  hrs = hrs % 24

  const timeToShowDays = `${days > 9 ? +days : '0' + days} days`
  const timeToShowHours = `${hrs > 9 ? +hrs : '0' + hrs}`
  const timeToShowMins = `${min > 9 ? +min : '0' + min}`
  const timeToShowSecs = `${sec > 9 ? +sec : '0' + sec}`

  const combined = `${timeToShowDays} ${timeToShowHours}:${timeToShowMins}:${timeToShowSecs}`

  await routed.message.channel.send({
    content: 'Here are some of my statistics!!',
    embed: {
      title: 'Bot Statistics',
      color: 5472175,
      timestamp: Date(),
      footer: {
        text: 'Generated'
      },
      fields: [
        {
          name: 'Uptime',
          value: `\`${combined}\``,
          inline: false
        },

        {
          name: '------------',
          value: 'Messages',
          inline: false
        },
        {
          name: '~ Stat ~',
          value: 'seen\nsent\ntracked',
          inline: true
        },
        {
          name: '#',
          value: `\`${stats.messages.seen}\`\n\`${stats.messages.sent}\`\n\`${stats.messages.tracked}\``,
          inline: true
        },
        {
          name: '------------',
          value: 'Commands',
          inline: false
        },
        {
          name: '~ Stat ~',
          value: 'routed\ncompleted\ninvalid',
          inline: true
        },
        {
          name: '#',
          value: `\`${stats.commands.routed}\`\n\`${stats.commands.completed}\`\n\`${stats.commands.invalid}\``,
          inline: true
        }
      ]
    }
  })

  return true
}
