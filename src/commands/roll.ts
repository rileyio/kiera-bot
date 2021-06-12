import * as Random from 'random'
import { RouterRouted, ExportRoutes } from '@/router'
import { rollDie, rollDice } from '@/embedded/roll-embed'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Fun',
  controller: roll,
  description: 'Help.Fun.Roll.Description',
  example: '{{prefix}}roll',
  name: 'roll-die',
  validate: '/roll:string/count1?=string/count2?=number',
  permissions: { serverOnly: false }
})

/**
 * Roll (a die | dice)
 * @export
 * @param {RouterRouted} routed
 */
export async function roll(routed: RouterRouted) {
  // Check if the first argument matches the `2d8` spec.
  if (routed.v.o.count1 || routed.v.o.count1) {
    if (routed.v.o.count1.match(/^[0-9]+d[0-9]+$/g)) {
      // Split and assign them to their appropriate variable inputs to simulate a user inputting /roll <amount> <worth>
      const [amount, worth] = routed.v.o.count1.split('d')
      routed.v.o.count1 = +amount
      routed.v.o.count2 = +worth
    }

    if (routed.v.o.count1 && routed.v.o.count2) {
      const set = []
      for (let index = 0; index < routed.v.o.count1; index++) {
        set.push(Random.int(1, routed.v.o.count2))
      }
      await routed.message.reply(rollDice(routed.v.o.count2 || 6, routed.v.o.count1, set))
      return true
    }

    // If there is a number specified as the second argument cast it to a number.
    if (routed.v.o.count1) {
      // Perform the conversion of string to num if possible.
      routed.v.o.count1 = !isNaN(routed.v.o.count1) ? +routed.v.o.count1 : 6
    }
  }

  const set: Array<any> = [Random.int(1, routed.v.o.count1 || 6)]
  await routed.message.reply(rollDie(Number(routed.v.o.count1 || 6), set))
  return true
}
