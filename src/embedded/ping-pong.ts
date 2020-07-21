import { performance } from 'perf_hooks'

export function pongResponse(database: number, commandStart: number) {
  return {
    embed: {
      title: 'Pong',
      description: 'The following are some latency stats.',
      color: 9442302,
      timestamp: '2020-07-21T02:06:44.984Z',
      fields: [
        {
          name: 'Database',
          value: `\`${Math.round(database)}ms\``,
          inline: true
        },
        {
          name: 'Command Router',
          value: `\`${Math.round(commandStart)}ms\``,
          inline: true
        }
      ]
    }
  }
}
