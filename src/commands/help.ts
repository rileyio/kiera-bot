import * as Utils from '../utils/'
import { RouterRouted } from '../router/router';

export namespace Help {
  export async function genericFallback(routed: RouterRouted) {
    await routed.message.reply(Utils.sb(Utils.en.help.main));
    return true
  }

  export async function commandHelp(routed: RouterRouted) {
    // Determine if there's a route, if not inform the user
    if (Utils.en.help[routed.v.o.command]) {
    await routed.message.reply(Utils.sb(Utils.en.help[routed.v.o.command]))
    }
    else {
      await routed.message.reply(Utils.en.error.commandHelpMissing)
    }

    return true
  }
}
