import { RouterRouted } from '../utils/router';
import { sb, en } from '../string-builder';

export namespace Help {
  export async function genericFallback(routed: RouterRouted) {
    await routed.message.reply(sb(en.help.main));
  }

  export async function commandHelp(routed: RouterRouted) {
    // Determine if there's a route, if not inform the user
    if (en.help[routed.v.o.command]) {
    await routed.message.reply(sb(en.help[routed.v.o.command]))
    }
    else {
      await routed.message.reply(en.error.commandHelpMissing)
    }
  }
}
