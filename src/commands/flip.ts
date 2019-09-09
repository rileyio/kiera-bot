import { RouterRouted } from '../router/router';
import { ExportRoutes } from '../router/routes-exporter';
import { flipCoin } from '../embedded/flip-embed';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Fun',
    commandTarget: 'argument',
    controller: flip,
    example: '{{prefix}}flip',
    name: 'flip-coin',
    validate: '/flip:string',
    permissions: { serverOnly: false }
  }
)

/**
 * Flip a coin
 * @export
 * @param {RouterRouted} routed
 */
export async function flip(routed: RouterRouted) {
  await routed.message.reply(flipCoin(Math.floor(Math.random() * Number(2))))
  return true
}