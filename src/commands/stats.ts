import { RouterRouted } from '../router/router';
import { ExportRoutes } from '../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Info',
    commandTarget: 'argument',
    controller: commandUsageStats,
    example: '{{prefix}}stats commands',
    name: 'stats-commands',
    validate: '/stats:string/commands:string'
  }
)

export async function commandUsageStats(routed: RouterRouted) {
  // Get Audit trail for commands from DB to run stats on
  var collection = await routed.bot.DB.aggregate<{ _id: string, count: number }>('audit-log', [
    {
      $match: { type: 'bot.command' }
    },
    {
      $group: {
        _id: '$name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]) as Array<{ _id: string, count: number, percent?: number }>

  var total = 0
  var text = `Statistics by command usage:
\`\`\`md
`

  // Determine total
  collection.forEach((item) => {
    total += item.count
  })
  console.log('Total:', total)

  // Calculate each item's percentage of the total
  collection = collection.map(item => {
    item['percent'] = item.count / total
    return item
  })
  console.log('Collection:', collection)

  // Generate text visualisation
  for (var i = 0; i < collection.length && i < 10; i++) {
    text
      += `# ${collection[i]._id} (${collection[i].count})\n`
      + `  ` + Array(Math.round(collection[i].percent * 100)).fill('▀').reduce((a, c) => a += c) + ` [${Math.round(collection[i].percent * 100)}%]`
      + '\n'
  }

  // Append a little extra text to inform user some commands wont be seen in list due to count
  if (collection.length > 10) {
    text += `\n ... There are ${collection.length} commands in total but only showing the top 10`
  }

  // console.log(text)
  await routed.message.channel.send(text + '```')
  return true
}