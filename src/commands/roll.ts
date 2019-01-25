import { RouterRouted } from '../router/router';
import { rollDie, rollDice } from '../embedded/roll-embed';

export namespace Roll {
  /**
   * Roll (a die | dice)
   * @export
   * @param {RouterRouted} routed
   */
  export async function roll(routed: RouterRouted) {
    if (routed.v.o.count1 && routed.v.o.count2) {
      var set = []
      for (let index = 0; index < routed.v.o.count1; index++) {
        set.push(Math.floor(Math.random() * routed.v.o.count2 || 6) + 1)
      }
      await routed.message.reply(rollDice(routed.v.o.count2 || 6, routed.v.o.count1, set))
      return true
    }

    var set: Array<any> = [Math.floor(Math.random() * Number(routed.v.o.count1 || 6)) + 1]
    await routed.message.reply(rollDie(Number(routed.v.o.count1 || 6), set))
    return true
  }
}
