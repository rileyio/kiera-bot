import * as Random from 'random'
import { RouterRouted, ExportRoutes } from '@/router'
import { rollDie, rollDice } from '@/embedded/roll-embed'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Fun',
  commandTarget: 'argument',
  controller: roll,
  example: '{{prefix}}roll',
  name: 'roll-die',
  validate: '/roll:string/count1?=number/count2?=number',
  permissions: { serverOnly: false }
})

/**
 * Roll (a die | dice)
 * @export
 * @param {RouterRouted} routed
 */
export async function roll(routed: RouterRouted) {
  if (routed.v.o.count1 && routed.v.o.count2) {
    var set = []
    for (let index = 0; index < routed.v.o.count1; index++) {
      set.push(Random.int(1, routed.v.o.count2))
    }
    await routed.message.reply(rollDice(routed.v.o.count2 || 6, routed.v.o.count1, set))
    return true
  }

  var set: Array<any> = [Random.int(1, routed.v.o.count1 || 6)]
  await routed.message.reply(rollDie(Number(routed.v.o.count1 || 6), set))
  return true
}
