import { EmbedBuilder } from 'discord.js'

export function pongResponse(database: number, commandStart: number) {
  return new EmbedBuilder()
    .setTitle('Pong')
    .setDescription('The following are some latency stats.')
    .setColor(9442302)
    .setTimestamp(Date.now())
    .addFields(
      {
        inline: true,
        name: 'Database',
        value: `\`${Math.round(database)}ms\``
      },
      {
        inline: true,
        name: 'Command Router',
        value: `\`${Math.round(commandStart)}ms\``
      }
    )
}
