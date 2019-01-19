import { RouterRouted } from '../utils/router';

export namespace Devices {
  export async function devicesConnectedCount(routed: RouterRouted) {
    await routed.message.reply(`Devices Connected: \`${routed.bot.Lovense.devicesConnected.length}\``)
    return true
  }
}